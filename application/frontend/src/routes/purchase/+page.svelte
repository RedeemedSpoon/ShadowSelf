<script lang="ts">
  import {onMount, tick, untrack} from 'svelte';
  import {page} from '$app/state';
  import {goto, replaceState, invalidate} from '$app/navigation';
  import {request} from '$utils/webfetch';
  import {PRICING_TIERS, PURCHASE_INVOICE_MESSAGES} from '$constant';
  import {loadStripe} from '@stripe/stripe-js/pure';
  import type {Stripe, StripeElements, StripePaymentElement} from '@stripe/stripe-js';
  import type {CardCheckout, CryptoInvoice, Coins} from '$type';
  import type {PageData} from './$types';
  import Button from '$component/ui/Button.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import PurchaseExperience from '$component/purchase/PurchaseExperience.svelte';
  import PurchaseModal from '$component/purchase/PurchaseModal.svelte';
  import PurchaseSuccess from '$component/purchase/PurchaseSuccess.svelte';
  import {
    createPurchaseNavigation,
    readPurchaseDraft,
    savePurchaseDraft,
  } from '$component/purchase/purchase-navigation';
  import PurchaseConfirmation from '$component/purchase/PurchaseConfirmation.svelte';
  import PurchaseCryptoForm from '$component/purchase/PurchaseCryptoForm.svelte';
  import PurchaseInvoice from '$component/purchase/PurchaseInvoice.svelte';

  let {data}: {data: PageData} = $props();
  let plan = $state<keyof typeof PRICING_TIERS>('monthly');
  let pending = $state(false);
  let confirmationOpen = $state(false);
  let cardOpen = $state(false);
  let successOpen = $state(false);
  let paidIdentity = $state('');
  let invoiceOpen = $state(false);
  let mounted = $state(false);
  let restoredCard = $state(false);
  let invoiceRequested = $state(false);
  let flowEpoch = 0;
  let disposed = false;
  let error = $state('');
  let method = $state<'card' | 'crypto'>('card');
  let ticker = $state<Coins>('xmr');
  let refund = $state('');
  let invoice = $state<CryptoInvoice | null>(null);
  let status = $state('');
  let checkout = $state<CardCheckout | null>(null);
  let cardReady = $state(false);
  let invoiceRefreshing = $state(false);
  let requestID = $state<string>(untrack(() => data.requestID));
  let mountPoint = $state<HTMLDivElement>();
  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let payment: StripePaymentElement | null = null;
  let poll: ReturnType<typeof setInterval>;
  const renewal = $derived(page.url.searchParams.get('id'));
  const draftKey = $derived(`shadowself:purchase:${renewal || 'new'}`);
  const tier = $derived(PRICING_TIERS[plan]);
  const navigation = createPurchaseNavigation('/purchase', closePayment);

  $effect(() => {
    if (mounted) {
      savePurchaseDraft(draftKey, {
        plan,
        method,
        ticker,
        refund,
        requestID,
        invoiceID: invoice?.invoiceID,
        cardStarted: !!checkout || restoredCard,
        invoiceRequested,
        paidIdentity,
      });
    }
  });

  $effect(() => {
    if (invoiceOpen && invoice) {
      void navigation.start();
    }
  });

  function closePayment() {
    if (successOpen) {
      void finishPurchase();
      return;
    }

    cardOpen = false;
    confirmationOpen = false;
    invoiceOpen = false;
  }

  async function finishPurchase() {
    reset();
    await navigation.prepareHandoff();
  }

  function resumeCard() {
    if (checkout) {
      navigation.start();
      cardOpen = true;
    } else {
      void payCard();
    }
  }

  function reset() {
    savePurchaseDraft(draftKey, null);
    restoredCard = false;
    invoiceRequested = false;
    invoiceOpen = false;
    flowEpoch++;
    clearInterval(poll);
    payment?.destroy();
    payment = null;
    elements = null;
    stripe = null;
    checkout = null;
    invoice = null;
    error = '';
    status = '';
    pending = false;
    cardReady = false;
    invoiceRefreshing = false;
    cardOpen = false;
    confirmationOpen = false;
    successOpen = false;
    paidIdentity = '';
    plan = 'monthly';
    method = 'card';
    ticker = 'xmr';
    refund = '';
    requestID = crypto.randomUUID();
  }

  function paymentSucceeded(identityID: string) {
    if (disposed) {
      return;
    }

    clearInterval(poll);
    navigation.start();
    paidIdentity = identityID;
    cardOpen = false;
    confirmationOpen = false;
    invoice = null;
    successOpen = true;
    void invalidate('app:identities');
  }

  async function handoff() {
    const destination = renewal ? `/identity/${paidIdentity}` : `/create?id=${paidIdentity}`;

    reset();
    await navigation.prepareHandoff();
    await goto(destination);
  }

  function reviewCrypto(event: SubmitEvent) {
    event.preventDefault();
    navigation.start();
    confirmationOpen = true;
  }

  function choose(value: keyof typeof PRICING_TIERS) {
    if (pending || invoice || checkout || restoredCard || invoiceRequested) {
      return;
    }

    plan = value;
    requestID = crypto.randomUUID();
    error = '';
  }

  async function payCard(confirm = false) {
    if (pending || !data.billingEnabled) {
      return;
    }

    const epoch = flowEpoch;

    navigation.start();
    restoredCard = true;
    cardOpen = true;
    pending = true;
    error = '';

    try {
      const result = await request<CardCheckout>(confirm ? '/billing/checkout/confirm' : '/billing/checkout', 'POST', {
        plan,
        requestID,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      if (result.data.step === 'finish') {
        paymentSucceeded(result.data.identityID);
        return;
      }

      if (disposed || epoch !== flowEpoch) {
        return;
      }

      checkout = result.data;

      if (result.data.step === 'create' || result.data.step === 'auth') {
        await mountCard(result.data, epoch);
      }
    } catch (cause) {
      if (epoch === flowEpoch && !disposed) {
        error = cause instanceof Error ? cause.message : 'Could not start checkout.';
        cardOpen = true;
      }
    } finally {
      if (epoch === flowEpoch) {
        pending = false;
      }
    }
  }

  async function mountCard(details: CardCheckout, epoch = flowEpoch) {
    cardReady = false;

    if (!data.stripeKey) {
      throw new Error('Could not load the card form. Retry card checkout.');
    }

    loadStripe.setLoadParameters({advancedFraudSignals: false});
    stripe = await loadStripe(data.stripeKey);

    if (disposed || epoch !== flowEpoch) {
      return;
    }

    if (!stripe) {
      throw new Error('Stripe could not be loaded.');
    }

    if (details.step === 'auth') {
      cardOpen = false;

      const result = await stripe.confirmCardPayment(details.clientSecret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      paymentSucceeded(details.identityID);

      return;
    }

    await tick();

    if (disposed || epoch !== flowEpoch) {
      return;
    }

    payment?.destroy();
    elements = stripe.elements({
      clientSecret: details.clientSecret,
      appearance: {
        theme: 'night',
        variables: {colorPrimary: '#9b91ff', colorBackground: '#10192c', colorText: '#e6ebff', borderRadius: '5px'},
      },
    });
    payment = elements.create('payment');
    payment.on('ready', () => {
      if (epoch === flowEpoch) {
        cardReady = true;
      }
    });

    if (!mountPoint) {
      throw new Error('Payment form could not be displayed. Retry card checkout.');
    }

    payment.mount(mountPoint);
  }

  async function retryCard() {
    if (!checkout) {
      await payCard();
      return;
    }

    const epoch = flowEpoch;

    pending = true;
    error = '';

    try {
      await mountCard(checkout, epoch);
    } catch (cause) {
      if (epoch === flowEpoch && !disposed) {
        error = cause instanceof Error ? cause.message : 'Could not load card checkout. Try again.';
        cardOpen = true;
      }
    } finally {
      if (epoch === flowEpoch) {
        pending = false;
      }
    }
  }

  async function confirmCard() {
    if (!stripe || !elements || !checkout) {
      return;
    }

    const identityID = checkout.identityID;
    const epoch = flowEpoch;

    pending = true;
    error = '';
    cardOpen = false;

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {return_url: `${page.url.origin}/purchase?plan=${plan}&card_return=${requestID}`},
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      paymentSucceeded(identityID);
    } catch (cause) {
      if (epoch === flowEpoch && !disposed) {
        error = cause instanceof Error ? cause.message : 'Payment could not be confirmed. Retry this checkout.';
        cardOpen = true;
      }
    } finally {
      if (epoch === flowEpoch) {
        pending = false;
      }
    }
  }

  async function newInvoice() {
    if (pending || !data.billingEnabled) {
      return;
    }

    const epoch = flowEpoch;

    invoiceRequested = true;
    pending = true;
    error = '';

    replaceState(`?plan=${plan}&${renewal ? `id=${renewal}&` : ''}request=${requestID}`, page.state);

    try {
      const result = await request<CryptoInvoice>(
        renewal ? '/billing/crypto/renewals' : '/billing/crypto/invoices',
        'POST',
        {
          plan,
          requestID,
          swapCoin: ticker,
          refundAddress: refund || undefined,
          ...(renewal ? {identityID: renewal} : {}),
        },
      );

      if (!result.ok) {
        throw new Error(result.error);
      }

      if (epoch !== flowEpoch || disposed) {
        return;
      }

      await showInvoice(result.data, confirmationOpen);
    } catch (cause) {
      if (epoch !== flowEpoch || disposed) {
        return;
      }

      error = cause instanceof Error ? cause.message : 'Could not create an invoice.';
      await recoverInvoice(requestID);
    } finally {
      if (epoch === flowEpoch) {
        pending = false;
      }
    }
  }

  async function showInvoice(value: CryptoInvoice, open = true) {
    const epoch = flowEpoch;

    navigation.start();
    confirmationOpen = false;
    method = 'crypto';
    invoice = value;
    invoiceOpen = open;

    if (disposed || epoch !== flowEpoch) {
      return;
    }

    replaceState(`?plan=${plan}&${renewal ? `id=${renewal}&` : ''}invoice=${value.invoiceID}`, page.state);
    status = PURCHASE_INVOICE_MESSAGES[value.status] || 'Checking payment status.';
    clearInterval(poll);
    poll = setInterval(() => void refreshInvoice(), 5000);
    await refreshInvoice();
  }

  async function refreshInvoice() {
    if (!invoice || invoiceRefreshing) {
      return;
    }

    const epoch = flowEpoch;
    const renewalID = renewal;

    invoiceRefreshing = true;

    try {
      const result = await request<CryptoInvoice>(`/billing/crypto/invoices/${invoice.invoiceID}`);

      if (disposed || epoch !== flowEpoch) {
        if (!disposed && result.ok && result.data.status === 'paid' && (renewalID || result.data.identityID)) {
          paymentSucceeded(renewalID || result.data.identityID!);
        }

        return;
      }

      if (!result.ok) {
        status = `${result.error} Keep this invoice open and retry.`;
        return;
      }

      invoice = result.data;
      status = PURCHASE_INVOICE_MESSAGES[result.data.status] || result.data.status;

      if (result.data.status === 'underpaid') {
        status += ` Remaining ${result.data.remainingAmount} XMR.`;
      }

      if (result.data.status === 'paid' && (renewalID || result.data.identityID)) {
        paymentSucceeded(renewalID || result.data.identityID!);
      } else if (result.data.status === 'paid') {
        status = 'Payment confirmed. Preparing your identity…';
      }

      if (['late', 'refunded'].includes(result.data.status)) {
        clearInterval(poll);
      }
    } finally {
      if (epoch === flowEpoch) {
        invoiceRefreshing = false;
      }
    }
  }

  async function recoverInvoice(reference: string) {
    const epoch = flowEpoch;
    const result = await request<{invoiceID: string}>(`/billing/crypto/requests/${reference}`);

    if (result.ok && epoch === flowEpoch && !disposed) {
      const recovered = await request<CryptoInvoice>(`/billing/crypto/invoices/${result.data.invoiceID}`);

      if (recovered.ok && epoch === flowEpoch && !disposed) {
        error = '';
        await showInvoice(recovered.data);
      }
    }
  }

  onMount(() => {
    if (!data.billingEnabled) {
      return;
    }

    const saved = readPurchaseDraft(draftKey);

    if (saved) {
      plan = saved.plan;
      method = saved.method;
      ticker = saved.ticker;
      refund = saved.refund;
      requestID = saved.requestID || requestID;
      restoredCard = !!saved.cardStarted;
      invoiceRequested = !!saved.invoiceRequested;
      paidIdentity = saved.paidIdentity || '';
      successOpen = !!paidIdentity;
    }

    mounted = true;

    const desired = page.url.searchParams.get('plan');

    if (desired && desired in PRICING_TIERS) {
      plan = desired as typeof plan;
    }

    const returned =
      page.url.searchParams.get('card_return') || (!successOpen && saved?.cardStarted ? saved.requestID : null);

    if (returned) {
      requestID = returned;
      void payCard();
    }

    const reference =
      page.url.searchParams.get('request') ||
      (!successOpen && saved?.invoiceRequested && !saved?.invoiceID ? saved?.requestID : null);

    if (reference) {
      requestID = reference;
      void recoverInvoice(reference);
    }

    const id = page.url.searchParams.get('invoice') || (!successOpen ? saved?.invoiceID : null);

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
      disposed = true;
      clearInterval(poll);
      payment?.destroy();
    };
  });
</script>

<svelte:head
  ><title
    >{!data.billingEnabled ? 'Purchases are disabled' : renewal ? 'Renew identity' : 'Choose an identity plan'} | ShadowSelf</title
  ></svelte:head>
{#if !data.billingEnabled}
  <div class="empty-state">
    <Icon name="card" size={42} />
    <h1>Purchases are disabled</h1>
    <p>New identity purchases and renewals are currently unavailable.</p>
    <a class="control-button secondary" href="/dashboard">Back to identities</a>
  </div>
{:else}
  <PurchaseExperience
    bind:plan
    bind:method
    renewal={!!renewal}
    locked={pending || !!invoice || !!checkout || restoredCard || invoiceRequested || successOpen}
    onchange={choose}
    onmethodchange={() => (error = '')}>
    {#snippet payment()}
      {#if invoice}
        <PurchaseInvoice
          bind:open={invoiceOpen}
          {invoice}
          message={status}
          pending={invoiceRefreshing}
          onrefresh={refreshInvoice}
          ondismiss={navigation.dismiss} />
      {:else if method === 'crypto' || renewal}
        <PurchaseCryptoForm bind:ticker bind:refund {pending} onsubmit={reviewCrypto} />
      {:else}
        <div class="card-start">
          <p>Pay securely by card.<br /><span>Stripe handles your card details and subscription payments.</span></p>
          <Button icon="card" loading={pending} onclick={resumeCard}>Review card payment</Button>
        </div>
      {/if}
    {/snippet}
  </PurchaseExperience>

  <PurchaseModal bind:open={cardOpen} title="Card payment" label="SECURE CHECKOUT" ondismiss={navigation.dismiss}>
    <PurchaseConfirmation {plan} method="card" />
    <div class="card-checkout">
      {#if error}<p class="purchase-error" role="alert">{error}</p>{/if}
      {#if checkout?.step === 'confirm'}
        <div class="saved-card">
          <span>Saved payment method</span><strong>{checkout.cardName} ending {checkout.last4}</strong>
        </div>
        <div class="card-actions">
          <Button variant="secondary" disabled={pending} onclick={navigation.dismiss}>Back</Button><Button
            loading={pending}
            onclick={() => payCard(true)}>Pay ${tier.price.toFixed(2)}</Button>
        </div>
      {:else}
        {#if !error || cardReady}<div class="stripe-mount" bind:this={mountPoint}></div>{/if}
        <div class="card-actions">
          <Button variant="secondary" disabled={pending} onclick={navigation.dismiss}>Back</Button
          >{#if error && !cardReady}<Button loading={pending} onclick={retryCard}>Retry card checkout</Button
            >{:else}<Button disabled={!cardReady} loading={pending} onclick={confirmCard}
              >Pay ${tier.price.toFixed(2)}</Button
            >{/if}
        </div>
      {/if}
    </div>
  </PurchaseModal>
  <PurchaseModal
    bind:open={confirmationOpen}
    title={renewal ? 'Confirm renewal' : 'Review your purchase'}
    ondismiss={navigation.dismiss}>
    {#if error}<p class="purchase-error" role="alert">{error}</p>{/if}
    <PurchaseConfirmation {plan} method="crypto"
      ><Button variant="secondary" disabled={pending} onclick={navigation.dismiss}>Back</Button><Button
        loading={pending}
        onclick={newInvoice}>Create payment invoice</Button
      ></PurchaseConfirmation>
  </PurchaseModal>
  <PurchaseSuccess bind:open={successOpen} renewal={!!renewal} oncontinue={handoff} ondismiss={finishPurchase} />
{/if}

<style>
  .card-checkout {
    margin-top: 24px;
  }
  .card-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }
  .stripe-mount {
    min-height: 150px;
  }
  .saved-card {
    display: grid;
    gap: 8px;
    padding: 16px 0;
  }
  .saved-card span {
    color: #9e91bd;
    font-size: 11px;
  }
  .saved-card strong {
    color: #d4c8f0;
    font-size: 15px;
    font-weight: 500;
  }
  .card-start span {
    color: var(--muted);
    font-size: 11px;
  }
</style>
