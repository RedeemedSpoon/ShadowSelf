<script lang="ts">
  import {pricingModel} from '$store';
  import {CheckmarkImg, CheveronImg} from '$components';
  import {fly} from 'svelte/transition';
</script>

<div id="pricing-table">
  <div class="flex flex-col items-start gap-8 px-16 py-6 text-center">
    {#key $pricingModel.price}
      <div in:fly={{x: -30, duration: 1000, opacity: 0}}>
        <h3 class="mb-4 mt-8 text-left text-4xl font-bold text-neutral-300">{$pricingModel.title}</h3>
        <div class="flex items-baseline gap-3">
          <h1 class="flex items-start gap-1 text-6xl">
            <span class="mt-6 text-4xl">$</span>{$pricingModel.price}
          </h1>
          <p class="text-xl text-neutral-400">{$pricingModel.description}</p>
        </div>
      </div>
    {/key}
    <div class="flex gap-8 py-4 text-left text-xl leading-10">
      <ul class="list-inside">
        <li><CheckmarkImg />Custom Identity</li>
        <li><CheckmarkImg />Email Address</li>
        <li><CheckmarkImg />Phone Number</li>
      </ul>
      <ul class="mx-8 list-inside">
        <li><CheckmarkImg />Virtual Card</li>
        <li><CheckmarkImg />Crypto Wallet</li>
        <li><CheckmarkImg />VPN Access</li>
      </ul>
      <ul class="list-inside">
        <li><CheckmarkImg />Account Management</li>
        <li><CheckmarkImg />Money-Back Guarantee</li>
        <li><CheckmarkImg />24/7 Support</li>
      </ul>
    </div>
    <p class="-my-4 text-sm text-neutral-500">All major crypto currencies are supported.</p>
  </div>
  <a href="/signup">
    <button id="purchase">Purchase<CheveronImg /></button>
  </a>
</div>

<style lang="postcss">
  #pricing-table {
    @apply card border-4 border-neutral-400 hover:-translate-y-4;
  }

  #purchase {
    @apply from-primary-700 to-primary-800 bg-gradient-to-b shadow-sm shadow-neutral-950;
    @apply w-full rounded-none rounded-b-xl border-t-2 border-neutral-400 text-center text-3xl font-bold;
    @apply mt-8 flex w-full items-center justify-center gap-2 p-6 text-3xl font-bold;
  }

  li {
    @apply flex items-center justify-start gap-4 text-nowrap;
  }
</style>
