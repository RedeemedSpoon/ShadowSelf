<script lang="ts">
  import {EmbeddedCheckout} from 'svelte-stripe';
  import {PricingTable} from '$component';
  import type {Notification} from '$type';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {notify} from '$lib';

  interface Props {
    data: PageData;
    form: Notification & {clientSecret: string};
  }

  let {data, form}: Props = $props();
  let clientSecret = $state() as string;

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (form?.clientSecret) clientSecret = form.clientSecret;
  });
</script>

<svelte:head>
  <title>ShadowSelf - Purchase</title>
  <meta name="description" content="Purchase an affordable identity to protect your privacy and safeguard your data." />
</svelte:head>

<div id="purchase">
  <h1>Purchase</h1>
  <p>Buy an identity to protect your privacy and safeguard your data.</p>
  <form method="POST" use:enhance>
    <PricingTable />
    <EmbeddedCheckout stripe={data.stripe} {clientSecret} />
  </form>
</div>

<style lang="postcss">
  #purchase {
    @apply mx-auto my-[10rem] flex h-fit w-1/2 flex-col gap-6;
  }
</style>
