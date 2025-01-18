<script lang="ts">
  import {type Notification, allPricingModels} from '$type';
  import {loadStripe, type Stripe} from '@stripe/stripe-js';
  import {pricingModel, fetching, showModal} from '$store';
  import {Card, LoadingButton, Modal} from '$component';
  import type {PageData} from './$types';
  import {fly} from 'svelte/transition';
  import {CheckmarkIcon} from '$icon';
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
    'Custom Identity',
    'Email Address',
    'Phone Number',
    'Virtual Card',
    'Crypto Wallet',
    'VPN/Proxy Access',
    'Account Management',
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
        fetching.set(1);
        await new Promise((resolve) => setTimeout(resolve, 650));

        checkout.confirm().then((result) => {
          fetching.set(0);
          if (result.type === 'error') notify(result.error.message, 'alert');
        });
      });
    });
  }

  async function handleSubmit() {
    fetching.set(1);
    setTimeout(() => (fetching.set(0), showModal.set(1), handleCheckout()), 1000);

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
  <Card className="py-12 px-8" upperClass="text-center w-fit mx-auto">
    <section id="header-text">
      <h1 class="text-6xl">Choose your plan</h1>
      <p>All plans include a 14-day refund, 24/7 support and the same level of security.</p>
    </section>
    <section id="plans" class="!flex-row">
      {#each ['Monthly', 'Annually', 'Lifetime'] as model}
        <button type="button" onclick={() => changeModel(model)}>{model}</button>
      {/each}
    </section>
    <section id="tier-table">
      {#key $pricingModel.price}
        <div in:fly={{x: -30, duration: 1000, opacity: 0}}>
          <h2 class="mb-4 mt-9 text-4xl font-bold text-neutral-300">{$pricingModel.title}</h2>
          <div class="flex items-baseline gap-3">
            <h1 class="text-primary-600 flex items-start gap-1 text-6xl">
              <span class="mt-6 text-4xl">$</span>{$pricingModel.price}
            </h1>
            <p class="text-xl text-neutral-400">{$pricingModel.description}</p>
          </div>
        </div>
      {/key}
      <ul class="text-left">
        {#each features as feature}
          <li><CheckmarkIcon className="cursor-auto !fill-green-500 !w-6 !h-6" />{feature}</li>
        {/each}
      </ul>
    </section>
    <section id="payment-methods">
      <form class="flex gap-4 px-8" method="POST" use:enhance={handleSubmit}>
        <input hidden value={$pricingModel.name} name="type" type="hidden" />
        <LoadingButton className="px-10 py-5">Pay with card</LoadingButton>
        <button disabled class="px-10 py-5">Pay with crypto</button>
      </form>
    </section>
  </Card>
  <Modal id={1}>
    <div class="m-4 flex flex-col gap-8">
      <div id="payment" class="sm:w-80"></div>
      <LoadingButton name="pay" index={1}>Pay</LoadingButton>
    </div>
  </Modal>
</div>

<style lang="postcss">
  #purchase {
    @apply mx-auto my-[12.5rem] flex h-fit w-1/2 flex-col gap-6;
  }

  section {
    @apply flex flex-col items-center justify-center gap-4 px-8 py-4;
  }

  li {
    @apply flex items-center gap-4;
  }
</style>
