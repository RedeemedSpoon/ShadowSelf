<script lang="ts">
  import {CheckmarkIcon, CreditCardIcon, QuestionIcon} from '$icon';
  import {pricingModel, fetchIndex, modalIndex} from '$store';
  import {type Notification, allPricingModels} from '$type';
  import {loadStripe, type Stripe} from '@stripe/stripe-js';
  import {LoadingButton, Modal, Tooltip} from '$component';
  import type {PageData} from './$types';
  import {fly} from 'svelte/transition';
  import {enhance} from '$app/forms';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  interface Props {
    data: PageData;
    form: Notification & {clientSecret: string};
  }

  let {data, form}: Props = $props();
  let clientSecret = $state() as string;
  let stripe = $state() as Stripe;

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
  });

  onMount(async () => {
    stripe = (await loadStripe(data.stripeKey!, {betas: ['custom_checkout_beta_5']})) as Stripe;
  });

  function changeModel(model: string) {
    const chosenModel = model.toLowerCase() as keyof typeof allPricingModels;
    pricingModel.set({name: model, ...allPricingModels[chosenModel]});
  }

  async function handleCheckout() {
    stripe.initCheckout({clientSecret}).then((checkout) => {
      const paymentElement = checkout.createElement('payment', {layout: 'tabs'});
      checkout.changeAppearance({
        theme: 'flat',
        variables: {
          colorPrimary: '#4338ca',
          colorBackground: '#1e293b',
          colorText: '#cbd5e1',
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          colorWarning: '#eab308',
          colorTextPlaceholder: '#475569',
          fontFamily: 'Inter, sans-serif',
          fontWeightNormal: '500',
          spacingUnit: '4px',
          borderRadius: '8px',
          tabLogoColor: 'dark',
        },
        rules: {
          '.Input': {
            marginTop: '14px',
            marginBottom: '8px',
            border: '2px solid #1e293b',
            backgroundColor: '#131c2e',
          },
          '.Input:focus': {
            boxShadow: '0 1px 1px 0 rgba(0, 0, 0, 0.07), 0 0 0 2px #4f46e5',
          },
        },
      });

      paymentElement.mount('#payment');
      document.querySelector('button[name="pay"]')!.addEventListener('click', async () => {
        fetchIndex.set(2);
        await new Promise((resolve) => setTimeout(resolve, 650));

        checkout.confirm().then(async (result) => {
          fetchIndex.set(0);
          if (result.type === 'error') notify(result.error.message, 'alert');
        });
      });
    });
  }

  async function handleSubmit() {
    fetchIndex.set(1);
    setTimeout(() => (fetchIndex.set(0), modalIndex.set(1), handleCheckout()), 1000);

    return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
      update({reset: false});
    };
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
      <form class="flex gap-6 px-8 max-sm:flex-col" method="POST" use:enhance={handleSubmit}>
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
    <div id="payment" class="sm:w-80"></div>
    <LoadingButton name="pay" index={2}>Pay</LoadingButton>
  </div>
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
