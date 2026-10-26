<script lang="ts">
  import {onMount, onDestroy, untrack} from 'svelte';
  import {goto} from '$app/navigation';
  import type {Coins, CryptoInvoice, InvoiceStatus, PurchaseReviewCase, PurchaseReviewStage} from '$type';
  import {PRICING_TIERS, CRYPTO_DISCOUNT, PURCHASE_INVOICE_MESSAGES} from '$constant';
  import {PURCHASE_REVIEW_COIN_RATES} from '$lib/constants/purchase-review';
  import PurchaseExperience from './PurchaseExperience.svelte';
  import PurchaseCryptoForm from './PurchaseCryptoForm.svelte';
  import PurchaseConfirmation from './PurchaseConfirmation.svelte';
  import PurchaseInvoice from './PurchaseInvoice.svelte';
  import Button from '$component/ui/Button.svelte';
  import PurchaseModal from './PurchaseModal.svelte';
  import PurchaseSuccess from './PurchaseSuccess.svelte';
  import {createPurchaseNavigation, readPurchaseDraft, savePurchaseDraft} from './purchase-navigation';
  import Status from '$component/ui/Status.svelte';

  let {
    configuration,
    initialPlan,
    initialCoin,
  }: {
    configuration: PurchaseReviewCase;
    initialPlan: keyof typeof PRICING_TIERS;
    initialCoin: Coins;
  } = $props();

  let plan = $state(untrack(() => initialPlan));
  let method = $state(untrack(() => configuration.method));
  let stage = $state<PurchaseReviewStage>(
    untrack(() =>
      configuration.stage === 'confirmation'
        ? configuration.method === 'card'
          ? 'card'
          : 'choose'
        : configuration.stage,
    ),
  );
  let confirmationOpen = $state(
    untrack(
      () =>
        configuration.method === 'crypto' && ['confirmation', 'loading', 'invoice-error'].includes(configuration.stage),
    ),
  );
  let cardOpen = $state(
    untrack(
      () =>
        (configuration.method === 'card' && !['choose', 'complete', 'identity'].includes(configuration.stage)) ||
        configuration.scenario === 'saved',
    ),
  );
  let successOpen = $state(untrack(() => ['complete', 'paid'].includes(configuration.stage)));
  let mounted = $state(false);
  let invoiceOpen = $state(true);
  const draftKey = $derived(`shadowself:purchase-review:${configuration.id}:${initialPlan}:${initialCoin}`);
  let ticker = $state(untrack(() => initialCoin));
  let refund = $state(untrack(() => (configuration.stage === 'invalid-refund' ? 'invalid-address' : '')));
  let cardNumber = $state('4242 4242 4242 4242');
  let expiry = $state('12 / 30');
  let cvc = $state('123');
  let timer: ReturnType<typeof setTimeout>;
  const createdAt = untrack(() => new Date().toISOString());
  const expiresAt = untrack(() =>
    new Date(
      Date.now() + (configuration.stage === 'expired' || configuration.stage === 'late' ? -5 : 15) * 60_000,
    ).toISOString(),
  );
  const renewal = $derived(configuration.scenario === 'renewal');
  const busy = $derived(stage === 'loading' || stage === 'processing');
  const total = $derived(PRICING_TIERS[plan].price * (method === 'crypto' || renewal ? 1 - CRYPTO_DISCOUNT / 100 : 1));
  const invoiceStatus = $derived(
    stage !== 'paid' && stage in PURCHASE_INVOICE_MESSAGES ? (stage as InvoiceStatus) : null,
  );
  const invoiceExists = $derived(
    !!invoiceStatus || (configuration.id === 'invoice-network-error' && stage === 'network-error'),
  );
  const checkoutStarted = $derived(
    method === 'card' &&
      (configuration.scenario === 'saved' ||
        ['card', 'declined', 'setup-error', 'authentication', 'authentication-failed', 'network-error'].includes(
          stage,
        )),
  );
  const invoice = $derived<CryptoInvoice>({
    invoiceID: '00000000-0000-4000-8000-000000000001',
    identityID: null,
    usdAmount: total.toFixed(2),
    depositAddress:
      stage === 'reconciling'
        ? null
        : `${ticker.toUpperCase()}_ADDRESS_000000000000000000000000000000000000000000000000000000000000000000`,
    depositAmount:
      stage === 'reconciling'
        ? null
        : (total / PURCHASE_REVIEW_COIN_RATES[ticker]).toFixed(ticker === 'usdt' ? 6 : ticker === 'xmr' ? 12 : 8),
    depositMemo: configuration.id === 'invoice-memo' ? '104829' : undefined,
    coin: ticker.toUpperCase(),
    status: invoiceStatus || 'pending',
    remainingAmount: '0.010000000000',
    createdAt,
    expiresAt,
  });
  const error = $derived(
    stage === 'declined'
      ? 'The payment was declined. Try another card or retry this checkout.'
      : stage === 'setup-error'
        ? 'Could not load the card form. Retry card checkout.'
        : stage === 'authentication-failed'
          ? 'Bank authentication was not completed. Retry authentication to continue.'
          : stage === 'network-error'
            ? 'The connection was interrupted. Your payment has not been confirmed. Retry this request.'
            : stage === 'invoice-error'
              ? 'Could not create an invoice. No payment has been requested. Try again.'
              : stage === 'invalid-refund'
                ? 'The refund address is not valid for the selected asset and network.'
                : '',
  );

  const navigation = createPurchaseNavigation('/purchase-review', closePayment);

  $effect(() => {
    if (mounted) {
      savePurchaseDraft(draftKey, {plan, method, ticker, refund, stage});
    }
  });

  $effect(() => {
    if (invoiceOpen && invoiceExists) {
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

  onMount(() => {
    const saved = readPurchaseDraft(draftKey);

    if (saved?.stage) {
      plan = saved.plan;
      method = saved.method;
      ticker = saved.ticker;
      refund = saved.refund;
      stage = saved.stage;
      cardOpen = method === 'card' && !['choose', 'complete', 'identity'].includes(stage);
      confirmationOpen = false;
      successOpen = stage === 'complete' || stage === 'paid';
    }

    mounted = true;

    if (cardOpen || confirmationOpen || invoiceExists || successOpen) {
      navigation.start();
    }

    if (stage === 'identity') {
      void handoff();
    }
  });

  onDestroy(() => clearTimeout(timer));

  function reset() {
    savePurchaseDraft(draftKey, null);
    clearTimeout(timer);
    invoiceOpen = false;
    cardOpen = false;
    confirmationOpen = false;
    successOpen = false;
    stage = 'choose';
    plan = 'monthly';
    method = 'card';
    ticker = 'xmr';
    refund = '';
    cardNumber = '4242 4242 4242 4242';
    expiry = '12 / 30';
    cvc = '123';
  }

  async function handoff() {
    reset();
    await navigation.prepareHandoff();
    await goto(renewal ? '/purchase-review/identity' : '/purchase-review/create?id=preview00001');
  }

  function beginCard() {
    navigation.start();

    if (stage === 'choose') {
      stage = 'card';
    }

    cardOpen = true;
  }

  function review(event: SubmitEvent) {
    event.preventDefault();
    navigation.start();
    confirmationOpen = true;
  }

  function completed() {
    cardOpen = false;
    confirmationOpen = false;
    stage = 'complete';
    successOpen = true;
  }

  function confirm(event?: SubmitEvent) {
    event?.preventDefault();
    confirmationOpen = false;

    if (method === 'crypto' || renewal) {
      stage = 'pending';
      invoiceOpen = true;
      return;
    }

    const digits = cardNumber.replace(/\s/g, '');

    stage = 'processing';
    timer = setTimeout(() => {
      if (digits === '4000000000000002') {
        stage = 'declined';
      } else if (digits === '4000002500003155') {
        stage = 'authentication';
      } else if (digits === '4000000000000119') {
        stage = 'network-error';
      } else {
        completed();
      }
    }, 500);
  }

  function refresh() {
    if (stage === 'network-error' && configuration.id === 'invoice-network-error') {
      stage = 'pending';
    } else if (stage === 'pending') {
      stage = 'confirming';
    } else if (stage === 'confirming') {
      completed();
    }
  }
</script>

<PurchaseExperience
  bind:plan
  bind:method
  {renewal}
  locked={busy || checkoutStarted || invoiceExists || successOpen}
  onchange={() => (stage = 'choose')}
  onmethodchange={() => (stage = 'choose')}>
  {#snippet payment()}
    {#if invoiceExists}
      <PurchaseInvoice
        bind:open={invoiceOpen}
        {invoice}
        message={(error || PURCHASE_INVOICE_MESSAGES[stage] || '') +
          (stage === 'underpaid' ? ` Remaining ${invoice.remainingAmount} XMR.` : '')}
        onrefresh={refresh}
        ondismiss={navigation.dismiss} />
    {:else if method === 'crypto' || renewal}
      {#if stage === 'invalid-refund'}<p class="purchase-error" role="alert">{error}</p>{/if}
      <PurchaseCryptoForm bind:ticker bind:refund pending={busy} onsubmit={review} />
    {:else}
      <div class="card-start">
        <p>Pay securely by card.<br /><span>Stripe handles your card details and subscription payments.</span></p>
        <Button icon="card" onclick={beginCard}>Review card payment</Button>
      </div>
    {/if}
  {/snippet}
</PurchaseExperience>

<PurchaseModal bind:open={cardOpen} title="Card payment" label="SECURE CHECKOUT" ondismiss={navigation.dismiss}>
  <PurchaseConfirmation {plan} method="card" />
  <div class="card-checkout">
    {#if error}<p class="purchase-error" role="alert">{error}</p>{/if}
    {#if busy}
      <div class="payment-loading" role="status">
        <span class="spinner"></span>
        <p>{stage === 'processing' ? 'Confirming your payment…' : 'Loading secure card checkout…'}</p>
        <Button loading disabled>{stage === 'processing' ? 'Processing payment' : 'Please wait'}</Button>
      </div>
    {:else if stage === 'authentication' || stage === 'authentication-failed'}
      <Status message="Your bank requires payment authentication." />
      <div class="card-actions">
        <Button variant="secondary" onclick={navigation.dismiss}>Back</Button><Button onclick={completed}
          >Continue authentication</Button>
      </div>
    {:else if stage === 'setup-error'}
      <div class="card-actions">
        <Button variant="secondary" onclick={navigation.dismiss}>Back</Button><Button onclick={() => (stage = 'card')}
          >Retry card checkout</Button>
      </div>
    {:else if configuration.scenario === 'saved'}
      <div class="saved-card"><span>Saved payment method</span><strong>Visa ending 4242</strong></div>
      <div class="card-actions">
        <Button variant="secondary" onclick={navigation.dismiss}>Back</Button><Button onclick={() => confirm()}
          >Pay ${total.toFixed(2)}</Button>
      </div>
    {:else}
      <form onsubmit={confirm}>
        <div class="field">
          <label for="sample-number">Card number</label><input
            id="sample-number"
            bind:value={cardNumber}
            pattern={'[0-9 ]{12,23}'}
            inputmode="numeric"
            autocomplete="off"
            required />
        </div>
        <div class="card-details">
          <div class="field">
            <label for="sample-expiry">Expiry</label><input
              id="sample-expiry"
              bind:value={expiry}
              pattern={'(0[1-9]|1[0-2]) / [0-9]{2}'}
              placeholder="MM / YY"
              autocomplete="off"
              required />
          </div>
          <div class="field">
            <label for="sample-cvc">Security code</label><input
              id="sample-cvc"
              bind:value={cvc}
              pattern={'[0-9]{3,4}'}
              inputmode="numeric"
              autocomplete="off"
              required />
          </div>
        </div>
        <div class="card-actions">
          <Button variant="secondary" onclick={navigation.dismiss}>Back</Button><Button type="submit"
            >Pay ${total.toFixed(2)}</Button>
        </div>
      </form>
    {/if}
  </div>
</PurchaseModal>

<PurchaseModal
  bind:open={confirmationOpen}
  title={renewal ? 'Confirm renewal' : 'Review your purchase'}
  ondismiss={navigation.dismiss}>
  {#if error}<p class="purchase-error" role="alert">{error}</p>{/if}
  <PurchaseConfirmation {plan} method="crypto"
    ><Button variant="secondary" disabled={busy} onclick={navigation.dismiss}>Back</Button><Button
      loading={busy}
      onclick={() => confirm()}>Create payment invoice</Button
    ></PurchaseConfirmation>
</PurchaseModal>
<PurchaseSuccess bind:open={successOpen} {renewal} oncontinue={handoff} ondismiss={finishPurchase} />

<style>
  .card-checkout {
    margin-top: 24px;
  }
  .card-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .card-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
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
    font-size: 15px;
    font-weight: 500;
    color: #d4c8f0;
  }
  .payment-loading {
    display: grid;
    justify-items: center;
    gap: 15px;
    padding: 20px 0;
    color: var(--accent-light);
  }
  .payment-loading p {
    color: #b8abd5;
    font-size: 12px;
  }
  .card-start span {
    color: var(--muted);
    font-size: 11px;
  }
  @media (max-width: 400px) {
    .card-details {
      gap: 12px;
    }
  }
</style>
