<script lang="ts">
  import {PaymentElement, Elements, LinkAuthenticationElement} from 'svelte-stripe';
  import {loadStripe, type Stripe, type StripeElements} from '@stripe/stripe-js';
  import {fetching, pricingModel, showModal} from '$store';
  import {LoadingButton, Modal} from '$component';
  import {notify, changePricingModel} from '$lib';
  import type {Notification} from '$type';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {onMount} from 'svelte';

  interface Props {
    data: PageData;
    form: Notification & {clientSecret: string};
  }

  let {data, form}: Props = $props();
  let clientSecret = $state() as string;
  let stripe = $state() as Stripe;
  let elements = $state() as StripeElements;

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (form?.clientSecret) clientSecret = form.clientSecret;
  });

  onMount(async () => {
    stripe = (await loadStripe(data.stripeKey!)) as Stripe;
  });

  async function handleSubmit() {
    fetching.set(1);
    setTimeout(() => (fetching.set(0), showModal.set(1)), 1000);

    return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
      update({reset: false});
    };
  }

  async function handlePay(event: Event) {
    event.preventDefault();
    showModal.set(2);

    elements.submit();
    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
    });
    console.log(result);
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
    <div id="pricing-model">
      <div id="select-model-box"></div>
      {#each ['Monthly', 'Annually', 'Lifetime'] as model}
        <button type="button" class:!text-neutral-300={model === $pricingModel.name} onclick={() => changePricingModel(model)}>
          {model}
        </button>
      {/each}
    </div>
    <input hidden value={$pricingModel.name} name="type" type="hidden" />
    <LoadingButton className="w-fit px-16 py-6 text-2xl mt-4">Purchase</LoadingButton>
  </form>
  <Modal id={1}>
    <form onsubmit={handlePay} method="POST">
      {#if clientSecret}
        <Elements {stripe} {clientSecret} bind:elements>
          <LinkAuthenticationElement />
          <PaymentElement />
        </Elements>
        <LoadingButton index={2}>Pay</LoadingButton>
      {/if}
    </form>
  </Modal>
</div>

<style lang="postcss">
  #purchase {
    @apply mx-auto my-[12.5rem] flex h-fit w-1/2 flex-col gap-6;
  }

  form {
    @apply flex flex-col gap-8 text-center;
  }

  #pricing-model {
    @apply relative flex w-fit rounded-full border-2 border-neutral-300 bg-neutral-950/50 shadow-xl shadow-neutral-900;
  }

  #pricing-model button {
    @apply bg-none px-10 py-6 text-2xl font-medium text-neutral-500 shadow-xl hover:text-neutral-600;
  }

  #select-model-box {
    @apply absolute left-0 h-full w-1/3 rounded-full bg-neutral-300 bg-opacity-15 transition-all duration-300 ease-in-out;
  }
</style>
