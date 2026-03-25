<script lang="ts">
  import LoadingButton from '$component/buttons/LoadingButton.svelte';
  import CopyButton from '$component/buttons/CopyButton.svelte';
  import Modal from '$component/containers/Modal.svelte';

  import CreditCardIcon from '$icon/finance/CreditCard.svelte';
  import CheckmarkIcon from '$icon/status/Checkmark.svelte';
  import WalletIcon from '$icon/finance/Wallet.svelte';

  import type {Appearance, Stripe, StripeElements, StripePaymentElement} from '@stripe/stripe-js';
  import {CRYPTO_DISCOUNT, FEATURES, PRICING_TIERS} from '$constant';
  import {pricingModel, activeModal, pendingID} from '$store';
  import {notify, awaitPending} from '$utils/shared';
  import {loadStripe} from '@stripe/stripe-js/pure';
  import type {Notification, Billing} from '$type';
  import type {PageData} from './$types';
  import {fly} from 'svelte/transition';
  import {enhance} from '$app/forms';
  import {page} from '$app/state';
  import QRCode from 'qrcode';

  interface Props {
    data: PageData;
    form: Notification & Billing;
  }

  let {data, form}: Props = $props();

  let paymentElement = $state() as StripePaymentElement;
  let elements = $state() as StripeElements;
  let stripe = $state() as Stripe;

  let clientSecret = $state() as Billing['clientSecret'];
  let identityID = $state() as Billing['identityID'];
  let cardName = $state() as Billing['cardName'];
  let last4 = $state() as Billing['last4'];
  let step = $state() as Billing['step'];
  let stripeLoaded = $state(false);
  let isStripeLoading = false;

  let ws: WebSocket | null = null;
  let qrImage = $state('');
  let cryptoChoice = $state('xmr');
  let cryptoInvoice = $state<Billing | null>(null);
  let invoiceStatus = $state({message: 'Waiting for payment...', color: 'text-neutral-500'});
  let renewID = $state(page.url.searchParams.get('renewID'));

  $effect(() => {
    if (renewID && $activeModal === 0) $activeModal = 3;
    if ($activeModal === 1 && !stripeLoaded && !isStripeLoading) {
      isStripeLoading = true;
      initStripe();
    }

    if (form?.message) notify(form.message, form.type);
    if (form?.clientSecret) clientSecret = form.clientSecret;
    if (form?.identityID) identityID = form.identityID;
    if (form?.cardName) cardName = form.cardName;
    if (form?.last4) last4 = form.last4;
    if (form?.step) {
      step = form.step;
      form.step = '' as Billing['step'];
      handleCheckout();
    }
    if (form?.invoiceID) {
      cryptoInvoice = form;
      generateQR();
      connectWS();
    }
  });

  async function generateQR() {
    qrImage = await QRCode.toDataURL(cryptoInvoice!.depositAddress, {width: 300, margin: 2});
  }

  function connectWS() {
    if (ws) ws.close();
    invoiceStatus = {message: 'Connecting to server...', color: 'text-yellow-500'};
    ws = new WebSocket(`wss//${window.location.host}/billing/crypto/track-invoice/${cryptoInvoice?.invoiceID}`);

    const handleConnectionClose = () => {
      if (!invoiceStatus.message.includes('expired')) {
        invoiceStatus = {message: 'Connection lost. Please refresh.', color: 'text-red-500'};
      }
    };

    ws.onopen = () => (invoiceStatus = {message: 'Connected. Waiting for payment.', color: 'text-green-500'});
    ws.onclose = handleConnectionClose;
    ws.onerror = handleConnectionClose;

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'paid') {
        notify('Payment received!', 'success');
        await await new Promise((resolve) => setTimeout(resolve, 1000));

        if (renewID) window.location.href = '/dashboard';
        else window.location.href = '/create?id=' + data.identityID;
      }

      if (data.status === 'underpaid') {
        const message = `Underpaid! Please send ${data.remainingAmount} more ${cryptoInvoice?.coin.toUpperCase()}`;
        invoiceStatus = {message, color: 'text-yellow-500'};
        notify(message, 'info');
      }

      if (data.status === 'expired') {
        const message = 'Invoice expired. Please generate a new one.';
        invoiceStatus = {message, color: 'text-red-500'};
        notify(message, 'alert');

        setTimeout(() => {
          $activeModal = 0;
          cryptoInvoice = null;
        }, 3000);
      }
    };
  }

  function changeModel(model: string) {
    const chosenModel = model.toLowerCase() as keyof typeof PRICING_TIERS;
    pricingModel.set({name: model, ...PRICING_TIERS[chosenModel]});
  }

  async function handleCheckout() {
    switch (step) {
      case 'create': {
        if (!clientSecret) return setTimeout(() => handleCheckout(), 100);
        if (paymentElement) {
          paymentElement.unmount();
          paymentElement.destroy();
        }

        stripeLoaded = false;
        isStripeLoading = false;

        $activeModal = 1;
        break;
      }

      case 'auth': {
        stripe.confirmCardPayment(clientSecret).then((result) => {
          if (result.error) return notify(result.error.message!, 'alert');
          else window.location.href = '/create?id=' + identityID;
        });
        break;
      }

      case 'confirm':
        $activeModal = 2;
        break;

      case 'finish':
        window.location.href = '/create?id=' + identityID;
        break;
    }
  }

  async function initStripe() {
    $pendingID = 2;
    loadStripe.setLoadParameters({advancedFraudSignals: false});
    stripe = (await loadStripe(data.stripeKey)) as Stripe;

    const appearance = {
      theme: 'flat',
      variables: {
        colorPrimary: '#4338ca',
        colorBackground: '#1e293b',
        colorText: '#cbd5e1',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {border: '2px solid #374151', backgroundColor: '#131c2e', color: '#cbd5e1'},
        '.Input:focus': {borderColor: '#4f46e5', boxShadow: '0 0 0 1px #4f46e5'},
      },
    } as Appearance;

    elements = stripe.elements({clientSecret, appearance});
    paymentElement = elements.create('payment', {layout: 'tabs'});

    setTimeout(() => {
      const mountPoint = document.getElementById('payment-element');
      paymentElement.mount(mountPoint!);
      stripeLoaded = true;
      $pendingID = 0;
    }, 300);
  }

  async function completePayment() {
    $pendingID = 2;
    const returnUrl = page.url.origin + '/create?id=' + identityID;
    const result = await stripe.confirmPayment({elements, confirmParams: {return_url: returnUrl}});

    if (result.error) {
      notify(result.error.message!, 'alert');
      $pendingID = 0;
    }
  }
</script>

<svelte:head>
  <title>ShadowSelf - Purchase</title>
  <meta name="description" content="Purchase an affordable identity to protect your privacy and safeguard your data." />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
</svelte:head>

<div id="purchase">
  <section id="top-text">
    <h1 class="text-4xl font-bold text-neutral-300 sm:text-6xl">Choose your plan</h1>
    <p class="text-center text-neutral-400">
      All plans include a 14-day refund, 24/7 support and the same level of security.
      <br />Buying with crypto gives a <b class="text-primary-600">{CRYPTO_DISCOUNT}% discount</b> across the board
    </p>
  </section>
  <div id="purchase-box">
    <section id="plans" class="flex-row! gap-0!">
      {#each ['Monthly', 'Annually', 'Lifetime'] as model (model)}
        <button class:active={$pricingModel.name === model} type="button" onclick={() => changeModel(model)}>{model}</button>
      {/each}
    </section>

    <section id="tier-table">
      <h2 class="mt-8 text-3xl font-bold text-neutral-300 md:text-5xl">Complete Identity</h2>
      {#key $pricingModel.price}
        <div in:fly={{x: -30, duration: 1000, opacity: 0}} class="my-1 flex flex-col items-center">
          <h1 class="text-primary-600 flex items-start gap-1 text-6xl">
            <span class="mt-6 text-3xl sm:text-4xl">$</span>{$pricingModel.price}
          </h1>
          <p class="text-xl text-neutral-400">{$pricingModel.description}</p>
        </div>
      {/key}
      <ul class="mt-4 grid gap-x-12 gap-y-4 text-center sm:grid-cols-2">
        {#each FEATURES as feature, id (id)}
          <li><CheckmarkIcon className="cursor-auto fill-green-500! w-6! h-6!" />{feature}</li>
        {/each}
      </ul>
    </section>

    <section id="payment-methods" class="my-10">
      <div class="payment-buttons flex gap-6 px-8 max-sm:flex-col">
        <form action="?/fiatInit" method="POST" use:enhance={() => awaitPending(true, 1)}>
          <input hidden value={$pricingModel.name} name="type" type="hidden" />
          <LoadingButton className="px-10 py-6 font-semibold"><CreditCardIcon className="w-8! h-8!" />Pay With Card</LoadingButton>
        </form>
        <LoadingButton index={2} type="button" onclick={() => ($activeModal = 3)} className="px-10 py-6 font-semibold">
          <WalletIcon className="w-8! h-8!" />Pay With Crypto
        </LoadingButton>
      </div>
    </section>
  </div>
</div>

<Modal id={1}>
  <div class="m-4 flex flex-col gap-8">
    <h3 class="text-center text-4xl font-bold text-neutral-300">Checkout</h3>
    <div id="payment-element" class="min-h-80 min-w-96 {!stripeLoaded ? 'hidden' : ''}"></div>
    {#if stripeLoaded}
      <LoadingButton name="pay" index={2} onclick={completePayment}>Pay ${$pricingModel.price}</LoadingButton>
    {/if}
  </div>
</Modal>

<Modal id={2}>
  <form method="POST" action="?/fiatConfirm" use:enhance={() => awaitPending(true, 2)} class="m-6 mb-2 flex flex-col gap-8">
    <h3 class="text-4xl font-bold text-neutral-300">Confirm Payment</h3>
    <p class="w-140 max-w-[80vw]">
      Are you sure you want to pay ${$pricingModel.price} for an identity with your {cardName} credits card ending with ****{last4}?
    </p>
    <input hidden value={$pricingModel.name} name="type" type="hidden" />
    <LoadingButton index={2} type="submit" disabled={step === 'auth' || step === 'finish'}>
      {$pricingModel.name === 'Lifetime' ? 'Pay' : 'Subscribe for'} ${$pricingModel.price}
    </LoadingButton>
    {#key step}
      {#if step === 'auth'}
        <p class="text-center text-sm text-neutral-500">Wait a moment. You might have to authenticate your card.</p>
      {:else}
        <br />
      {/if}
    {/key}
  </form>
</Modal>

<Modal id={3}>
  <div class="m-4 flex flex-col gap-8" id="crypto-modal">
    <h3 class="text-center text-4xl font-bold text-neutral-300">Crypto Checkout</h3>
    {#if !cryptoInvoice}
      <form
        method="POST"
        action={renewID ? '?/cryptoRenew' : '?/cryptoInit'}
        use:enhance={() => awaitPending(true, 3)}
        class="flex flex-col gap-6">
        <input hidden value={$pricingModel.name} name="plan" type="hidden" />
        <input hidden value={cryptoChoice} name="swapCoin" type="hidden" />
        <input hidden value={renewID || 0} name="id" type="hidden" />

        <div class="flex flex-col gap-2">
          <label for="cryptoChoice" class="text-sm text-neutral-500">Enter Coin Ticker (BTC, DOGE, SOL etc.)</label>
          <input type="text" id="cryptoChoice" bind:value={cryptoChoice} required placeholder="XMR" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="refundAddress" class="text-sm text-neutral-500">
            Refund Address (Optional, for {cryptoChoice.toUpperCase()})
          </label>
          <input
            type="text"
            id="refundAddress"
            name="refundAddress"
            placeholder="Enter your {cryptoChoice.toUpperCase()} refund address" />
        </div>

        <LoadingButton index={3} type="submit">Generate Invoice</LoadingButton>
      </form>
    {:else}
      <div class="flex flex-col items-center gap-6">
        <div class="rounded-xl bg-white p-4">
          <img src={qrImage} alt="Deposit QR Code" class="h-64 w-64 object-contain" />
        </div>

        <div class="flex w-full flex-col gap-4 rounded-xl border-2 border-neutral-600 bg-neutral-800/50 p-6">
          <div class="flex flex-col gap-1">
            <span class="text-sm text-neutral-500">Amount to send</span>
            <div class="flex items-center justify-between">
              <span class="text-primary-700 text-2xl font-bold">{cryptoInvoice.depositAmount} {cryptoInvoice.coin.toUpperCase()}</span>
              <CopyButton text={cryptoInvoice.depositAmount.toString()} />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-sm text-neutral-500">Deposit Address</span>
            <div class="flex items-center justify-between gap-4">
              <span class="font-mono text-sm break-all text-neutral-300">{cryptoInvoice.depositAddress}</span>
              <CopyButton text={cryptoInvoice.depositAddress} />
            </div>
          </div>

          {#if cryptoInvoice.externalLink}
            <a href={cryptoInvoice.externalLink} target="_blank" rel="noopener noreferrer" class="mt-2 text-center text-sm">
              Track swap on Trocador
            </a>
          {/if}
        </div>

        <div class="mt-2 flex items-center justify-center gap-2 text-sm">
          <p class="text-center text-sm {invoiceStatus.color}">{invoiceStatus.message}</p>
        </div>
      </div>
    {/if}
  </div>
</Modal>

<style lang="postcss">
  @reference "$style";

  #purchase {
    @apply mx-auto my-36 flex h-fit w-fit flex-col gap-16;
  }

  #purchase-box {
    @apply rounded-3xl border-2 border-neutral-400 bg-[#070d1f];
  }

  section {
    @apply flex flex-col items-center justify-center gap-4 px-4 py-4 md:px-8;
  }

  #plans button {
    @apply alt bg-[#070d1f] text-neutral-400 shadow-none hover:bg-[#2b3446] hover:text-neutral-300;
    @apply border-2 border-neutral-400 first:rounded-l-full last:rounded-r-full;
    @apply z-20 -mt-14 rounded-none px-4 py-5 text-sm font-semibold even:-mx-1 sm:px-8 sm:text-2xl;
  }

  .active {
    @apply bg-neutral-400! text-neutral-950! hover:text-neutral-950!;
  }

  li {
    @apply flex items-center gap-4;
  }

  #crypto-modal input {
    @apply border-neutral-700! bg-neutral-900/50! placeholder-neutral-700;
  }

  .payment-buttons > * {
    @apply w-auto!;
  }
</style>
