<script lang="ts">
  import {loadStripe, type Appearance, type Stripe, type StripeElements, type StripePaymentElement} from '@stripe/stripe-js';
  import {type Notification, type Billing, allPricingModels} from '$type';
  import {CheckmarkIcon, CreditCardIcon, QuestionIcon} from '$icon';
  import {pricingModel, modalIndex, fetchIndex} from '$store';
  import {LoadingButton, Modal, Tooltip} from '$component';
  import {notify, updateFetch} from '$lib';
  import type {PageData} from './$types';
  import {fly} from 'svelte/transition';
  import {enhance} from '$app/forms';
  import {page} from '$app/state';
  import {onMount} from 'svelte';

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

  const features = [
    'Personal Attributes',
    'Account Management',
    'Email Address',
    'Virtual Card',
    'Phone Number',
    'VPN Access',
    'And More...',
  ];

  $effect(() => {
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
  });

  onMount(async () => {
    stripe = (await loadStripe(data.stripeKey!)) as Stripe;
  });

  function changeModel(model: string) {
    const chosenModel = model.toLowerCase() as keyof typeof allPricingModels;
    pricingModel.set({name: model, ...allPricingModels[chosenModel]});
  }

  async function handleCheckout() {
    switch (step) {
      case 'create': {
        if (!clientSecret) return setTimeout(() => handleCheckout(), 100);
        if (paymentElement) paymentElement.unmount();

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

        const mountPoint = document.getElementById('payment-element');
        paymentElement.mount(mountPoint!);
        clientSecret = '';
        $modalIndex = 1;
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
        $modalIndex = 2;
        break;

      case 'finish':
        window.location.href = '/create?id=' + identityID;
        break;
    }
  }

  async function completePayment() {
    $fetchIndex = 2;
    const return_url = page.url.origin + '/create?id=' + identityID;
    const result = await stripe.confirmPayment({elements, confirmParams: {return_url: return_url}});
    if (result.error) {
      notify(result.error.message!, 'alert');
      $fetchIndex = 0;
    }
  }
</script>

<svelte:head>
  <title>ShadowSelf - Purchase</title>
  <meta name="description" content="Purchase an affordable identity to protect your privacy and safeguard your data." />
</svelte:head>

<div id="purchase">
  <section id="top-text">
    <h1 class="text-4xl sm:text-6xl">Choose your plan</h1>
    <p class="text-center">All plans include a 14-day refund, 24/7 support and the same level of security.</p>
  </section>
  <div id="purchase-box">
    <section id="plans" class="!flex-row !gap-0">
      {#each ['Monthly', 'Annually', 'Lifetime'] as model}
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
        {#each features as feature}
          <li><CheckmarkIcon className="cursor-auto !fill-green-500 !w-6 !h-6" />{feature}</li>
        {/each}
      </ul>
    </section>

    <section id="payment-methods" class="my-10">
      <form class="flex gap-6 px-8 max-sm:flex-col" action="?/init" method="POST" use:enhance={() => updateFetch(true, 1)}>
        <input hidden value={$pricingModel.name} name="type" type="hidden" />
        <LoadingButton className="px-10 py-6 font-semibold"><CreditCardIcon className="!w-8 !h-8" />Pay With Card</LoadingButton>
      </form>
      <Tooltip
        tip="Due to legal (KYC) and technical reasons, we require your credit card in order to create a virtual card. Sorry for the inconvenience!">
        <p class="mt-3 flex items-center gap-1 text-sm text-neutral-400 hover:cursor-help">
          Why do we not support crypto<QuestionIcon className="!w-3 !h-3 hover:cursor-help" />
        </p>
      </Tooltip>
    </section>
  </div>
</div>

<Modal id={1}>
  <div class="m-4 flex flex-col gap-8">
    <div id="payment-element" class="min-h-96 min-w-96"></div>
    <LoadingButton name="pay" index={2} onclick={completePayment}>Pay ${$pricingModel.price}</LoadingButton>
  </div>
</Modal>

<Modal id={2}>
  <form method="POST" action="?/confirm" use:enhance={() => updateFetch(true, 2)} class="m-6 mb-2 flex flex-col gap-8">
    <h3 class="text-4xl font-bold text-neutral-300">Confirm Payment</h3>
    <p class="w-[35rem] max-w-[80vw]">
      Are you sure you want to pay ${$pricingModel.price} for an identity with your {cardName} credits card ending with ****{last4}?
    </p>
    <input hidden value={$pricingModel.name} name="type" type="hidden" />
    <LoadingButton index={2} type="submit" disabled={step === 'auth'}>
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

<style lang="postcss">
  #purchase {
    @apply mx-auto my-[9rem] flex h-fit w-fit flex-col gap-16;
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
    @apply !bg-neutral-400 !text-neutral-950 hover:!text-neutral-950;
  }

  li {
    @apply flex items-center gap-4;
  }
</style>
