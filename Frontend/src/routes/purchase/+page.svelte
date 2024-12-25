<script lang="ts">
  import {loadStripe, type Stripe} from '@stripe/stripe-js';
  import {notify, changePricingModel, sendFrom} from '$lib';
  import {EmbeddedCheckout} from 'svelte-stripe';
  import {LoadingButton, Modal} from '$component';
  import {pricingModel, showModal} from '$store';
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

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (form?.clientSecret) clientSecret = form.clientSecret;
  });

  onMount(async () => {
    stripe = (await loadStripe(data.stripeKey)) as Stripe;
  });
</script>

<svelte:head>
  <title>ShadowSelf - Purchase</title>
  <meta name="description" content="Purchase an affordable identity to protect your privacy and safeguard your data." />
</svelte:head>

<div id="purchase">
  <form method="POST" use:enhance={() => sendFrom(true, 1, true, () => showModal.set(1))}>
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
  {#key clientSecret}
    <Modal id={1}>
      <div id="checkout">
        <EmbeddedCheckout {stripe} {clientSecret} />
      </div>
    </Modal>
  {/key}
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
