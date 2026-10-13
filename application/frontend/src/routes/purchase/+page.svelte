<script lang="ts">
  import {onMount, tick, untrack} from 'svelte';
  import {page} from '$app/state';
  import {goto, replaceState} from '$app/navigation';
  import {request} from '$utils/webfetch';
  import {PRICING_TIERS, CRYPTO_DISCOUNT} from '$constant';
  import {loadStripe} from '@stripe/stripe-js/pure';
  import type {Stripe, StripeElements, StripePaymentElement} from '@stripe/stripe-js';
  import type {CardCheckout, CryptoInvoice} from '$type';
  import type {PageData} from './$types';
  import QRCode from 'qrcode';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import Icon from '$component/ui/Icon.svelte';

  let {data}: {data: PageData} = $props();
  let plan = $state<keyof typeof PRICING_TIERS>('monthly');
  let pending = $state(false);
  let error = $state('');
  let method = $state<'card' | 'crypto'>('card');
  let ticker = $state('XMR');
  let refund = $state('');
  let invoice = $state<CryptoInvoice | null>(null);
  let status = $state('');
  let qr = $state('');
  let checkout = $state<CardCheckout | null>(null);
  let checkoutOpen = $state(false);
  let cardReady = $state(false);
  let requestID = $state(untrack(() => data.requestID));
  let mountPoint = $state<HTMLDivElement>();
  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let payment: StripePaymentElement;
  let poll: ReturnType<typeof setInterval>;
  const renewal = $derived(page.url.searchParams.get('id'));
  const tier = $derived(PRICING_TIERS[plan]);
  const capabilities = ['Identity profile', 'Dedicated mailbox', 'Phone number', 'Encrypted account vault', 'Client-signed crypto wallet'];
  const invoiceMessages: Record<string, string> = {
    waiting: 'Waiting for payment.',
    pending: 'Waiting for payment.',
    confirming: 'Payment observed. Waiting for confirmations.',
    paid: 'Payment confirmed.',
    refunded: 'This payment was refunded. Check the refund address and provider transaction.',
    late: 'Payment arrived after expiry. Reconciliation is required. Do not send another payment.',
    underpaid: 'Payment is below the required amount. Review the remaining balance before sending more.',
    expired: 'This invoice has expired. Check payment history before creating another invoice.',
  };

  function choose(value: keyof typeof PRICING_TIERS) {
    if (pending || invoice || checkout) {
      return;
    }

    plan = value;
    requestID = crypto.randomUUID();
    error = '';
  }

  async function payCard(confirm = false) {
    pending = true;
    error = '';

    try {
      const result = await request<CardCheckout>(confirm ? '/billing/checkout/confirm' : '/billing/checkout', 'POST', {plan, requestID});

      if (!result.ok) {
        throw new Error(result.error);
      }

      checkout = result.data;

      if (result.data.step === 'finish') {
        await goto(`/create?id=${result.data.identityID}`);

        return;
      }

      checkoutOpen = true;

      if (result.data.step === 'create' || result.data.step === 'auth') {
        await mountCard(result.data);
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not start checkout.';
    } finally {
      pending = false;
    }
  }

  async function mountCard(details: CardCheckout) {
    if (!data.stripeKey) {
      throw new Error('Card payments are unavailable.');
    }

    loadStripe.setLoadParameters({advancedFraudSignals: false});
    stripe = await loadStripe(data.stripeKey);

    if (!stripe) {
      throw new Error('Stripe could not be loaded.');
    }

    if (details.step === 'auth') {
      const result = await stripe.confirmCardPayment(details.clientSecret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      await goto(`/create?id=${details.identityID}`);

      return;
    }

    await tick();
    payment?.destroy();
    elements = stripe.elements({
      clientSecret: details.clientSecret,
      appearance: {theme: 'night', variables: {colorPrimary: '#8d7cf2', colorBackground: '#10192c', colorText: '#e6ebff', borderRadius: '5px'}},
    });
    payment = elements.create('payment');
    payment.on('ready', () => (cardReady = true));

    if (!mountPoint) {
      throw new Error('Payment form could not be displayed. Close checkout and retry.');
    }

    payment.mount(mountPoint);
  }

  async function confirmCard() {
    if (!stripe || !elements || !checkout) {
      return;
    }

    pending = true;
    error = '';

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {return_url: `${page.url.origin}/create?id=${checkout.identityID}`},
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await goto(`/create?id=${checkout.identityID}`);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Payment could not be confirmed. Retry this checkout.';
    } finally {
      pending = false;
    }
  }

  async function newInvoice(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';

    try {
      const result = await request<CryptoInvoice>(renewal ? '/billing/crypto/renewals' : '/billing/crypto/invoices', 'POST', {
        plan,
        requestID,
        swapCoin: ticker.toLowerCase(),
        refundAddress: refund || undefined,
        ...(renewal ? {identityID: renewal} : {}),
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      await showInvoice(result.data);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not create an invoice.';
    } finally {
      pending = false;
    }
  }

  async function showInvoice(value: CryptoInvoice) {
    invoice = value;
    qr = await QRCode.toDataURL(value.depositAddress, {width: 240, margin: 2});
    replaceState(`?${renewal ? `id=${renewal}&plan=${plan}&` : ''}invoice=${value.invoiceID}`, page.state);
    status = 'Waiting for payment.';
    clearInterval(poll);
    poll = setInterval(() => void refreshInvoice(), 5000);
    await refreshInvoice();
  }

  async function refreshInvoice() {
    if (!invoice) {
      return;
    }

    const result = await request<CryptoInvoice>(`/billing/crypto/invoices/${invoice.invoiceID}`);

    if (!result.ok) {
      status = `${result.error} Keep this invoice open and retry.`;

      return;
    }

    status = invoiceMessages[result.data.status] || result.data.status;

    if (result.data.status === 'underpaid') {
      status += ` Remaining ${result.data.remainingAmount} XMR.`;
    }

    if (result.data.status === 'paid') {
      clearInterval(poll);
      await goto(renewal ? `/identity/${renewal}` : `/create?id=${result.data.identityID}`);
    }

    if (['expired', 'late', 'refunded'].includes(result.data.status)) {
      clearInterval(poll);
    }
  }

  onMount(() => {
    const desired = page.url.searchParams.get('plan');

    if (desired && desired in PRICING_TIERS) {
      plan = desired as typeof plan;
    }

    const id = page.url.searchParams.get('invoice');

    if (id) {
      void request<CryptoInvoice>(`/billing/crypto/invoices/${id}`).then(async (result) => {
        if (result.ok) {
          await showInvoice(result.data);
        } else {
          error = result.error;
        }
      });
    }

    return () => {
      clearInterval(poll);
      payment?.destroy();
    };
  });
</script>

<svelte:head><title>{renewal ? 'Renew identity' : 'Choose an identity plan'} | ShadowSelf</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{renewal ? 'Renew identity' : 'New identity'}</h1>
  </div>
</div>
<Status message={error} kind="error" />
<div class="purchase-grid">
  <section class="panel">
    <div class="plan-switch" aria-label="Billing plan">
      {#each Object.keys(PRICING_TIERS) as choice (choice)}<button
          class:active={plan === choice}
          disabled={!!checkout || !!invoice || pending || !!renewal}
          onclick={() => choose(choice as typeof plan)}>{choice === 'annually' ? 'Annual' : choice === 'lifetime' ? 'Lifetime' : 'Monthly'}</button
        >{/each}
    </div>
    <div class="plan-price"><span>${tier.price.toFixed(2)}</span><small>{tier.description}</small></div>
    <h2>Included services</h2>
    <ul class="included-capabilities">
      {#each capabilities as capability (capability)}<li><Icon name="check" size={16} />{capability}</li>{/each}
    </ul>
    <small>{CRYPTO_DISCOUNT}% discount with crypto.</small>
  </section>
  <section class="panel">
    <h2>{invoice ? 'Payment invoice' : 'Payment method'}</h2>
    {#if invoice}<img class="qr-image" src={qr} alt="Invoice deposit address QR code" />
      <dl class="data-list">
        <div>
          <dt>Send amount</dt>
          <dd><Copy value={String(invoice.depositAmount)} label="Copy amount" /> {invoice.coin || ticker.toUpperCase()}</dd>
        </div>
        <div>
          <dt>Deposit address</dt>
          <dd><Copy value={invoice.depositAddress} label="Copy address" /></dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd>{invoice.invoiceID}</dd>
        </div>
      </dl>
      <Status message={status} />
      <div class="button-row invoice-actions">
        <Button variant="secondary" onclick={refreshInvoice}>Refresh payment status</Button>{#if invoice.externalLink}<a
            class="control-button quiet"
            href={invoice.externalLink}
            target="_blank"
            rel="noopener noreferrer">Track swap</a
          >{/if}
      </div>
      <small>Keep this invoice reference. An interrupted connection does not cancel a payment.</small>
    {:else}<div class="tabs payment-tabs">
        {#if !renewal}<button class:active={method === 'card'} onclick={() => (method = 'card')}><Icon name="card" size={16} />Card</button>{/if}<button
          class:active={method === 'crypto' || !!renewal}
          onclick={() => (method = 'crypto')}><Icon name="wallet" size={16} />Crypto</button>
      </div>
      {#if method === 'card' && !renewal}<p>Stripe handles card details and subscription payments.</p>
        <div class="checkout-actions"><Button icon="card" loading={pending} onclick={() => payCard()}>Continue with card</Button></div>{:else}<form
          onsubmit={newInvoice}>
          <div class="field">
            <label for="billing-coin">Payment coin</label><input
              id="billing-coin"
              bind:value={ticker}
              required
              pattern={'[A-Za-z0-9]{2,12}'}
              maxlength="12" /><small>XMR invoices are direct. Other coins use an external swap provider.</small>
          </div>
          <div class="field">
            <label for="billing-refund">Refund address</label><input
              id="billing-refund"
              bind:value={refund}
              placeholder="Optional address for {ticker.toUpperCase()}" />
          </div>
          <Button type="submit" icon="wallet" loading={pending}>Create payment invoice</Button>
        </form>{/if}{/if}
  </section>
</div>
<Dialog bind:open={checkoutOpen} title="Card checkout"
  ><Status message={error} kind="error" />{#if checkout?.step === 'confirm'}<p>
      Pay ${tier.price.toFixed(2)} using your saved {checkout.cardName} card ending {checkout.last4}.
    </p>
    <div class="checkout-actions"><Button loading={pending} onclick={() => payCard(true)}>Confirm purchase</Button></div>{:else}<div
      class="stripe-mount"
      bind:this={mountPoint}>
    </div>
    <div class="checkout-actions">
      <Button disabled={!cardReady} loading={pending} onclick={confirmCard}>Pay ${tier.price.toFixed(2)}</Button>
    </div>{/if}</Dialog>

<style>
  .purchase-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    max-width: 1050px;
  }
  .purchase-grid > .panel {
    margin: 0;
  }
  .plan-switch {
    display: flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid #a5b4fc20;
    border-radius: 6px;
    background: #070e1c;
  }
  .plan-switch button {
    flex: 1;
    padding: 10px 6px;
    background: none;
    border: 0;
    border-radius: 4px;
    color: #8493af;
    font-size: 11px;
  }
  .plan-switch button.active {
    background: #6253ec24;
    color: #c5bbff;
  }
  .plan-price {
    margin: 28px 0;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .plan-price span {
    font-size: 48px;
    letter-spacing: -2px;
    font-weight: 550;
  }
  .included-capabilities {
    padding: 0;
    margin: 24px 0;
    list-style: none;
    display: grid;
    gap: 15px;
  }
  .included-capabilities li {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #b7c3dc;
    font-size: 12px;
  }
  .included-capabilities :global(svg) {
    color: #8cbaab;
  }
  .payment-tabs {
    margin-top: 17px;
  }
  .checkout-actions,
  .invoice-actions {
    margin: 24px 0;
  }
  .stripe-mount {
    min-height: 230px;
  }
  @media (max-width: 900px) {
    .purchase-grid {
      grid-template-columns: 1fr;
    }
    .plan-price span {
      font-size: 42px;
    }
  }
</style>
