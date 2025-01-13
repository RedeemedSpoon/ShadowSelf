<script lang="ts">
  import {type Notification, allPricingModels} from '$type';
  import {loadStripe, type Stripe} from '@stripe/stripe-js';
  import {pricingModel, fetching, showModal} from '$store';
  import {LoadingButton, Modal} from '$component';
  import type {PageData} from './$types';
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
  <form method="POST" use:enhance={handleSubmit}>
    <h1 class="text-6xl">Purchase a new identity</h1>
    <p>Purchase an affordable identity to protect your privacy and safeguard your data.</p>
    <div class="flex justify-center gap-8 p-8">
      {#each ['Monthly', 'Annually', 'Lifetime'] as model}
        <button class:select-model={model === $pricingModel.name} type="button" onclick={() => changeModel(model)}>
          {model}
        </button>
      {/each}
    </div>
    <input hidden value={$pricingModel.name} name="type" type="hidden" />
    <LoadingButton className="w-fit px-16 py-6 text-2xl mt-4">Purchase</LoadingButton>
  </form>
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

  form {
    @apply flex flex-col gap-8 text-center;
  }

  .select-model {
    @apply bg-gradient-to-br from-green-500 to-green-700 text-white shadow-green-900 hover:shadow-green-950;
  }
</style>
