<script lang="ts">
  import {pricingModel} from '$store';
  import {CheckmarkImg, CheveronImg} from '$components';
</script>

<div id="pricing-table">
  <h3>{$pricingModel.title}</h3>
  <div class="flex flex-col items-center gap-4 px-16 py-6 text-center">
    <p class="-mb-7 text-neutral-600 line-through">${$pricingModel.price}</p>
    <h1 class="flex items-start text-6xl">
      <span class="mt-3 text-4xl">$</span>
      {$pricingModel.afterDiscount}
    </h1>
    <p class="-mt-6 mb-8 text-neutral-400">{$pricingModel.description}</p>
    <p>What will be included :</p>
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
    <a href="/signup">
      <button id="purchase">Purchase<CheveronImg /></button>
    </a>
    <p class="text-neutral-500">All major crypto currencies are supported.</p>
  </div>
</div>

<style lang="postcss">
  h3 {
    @apply from-primary-600 to-primary-700 bg-gradient-to-b shadow-md shadow-neutral-950;
    @apply w-full rounded-none rounded-t-xl border-b border-neutral-400 p-8 text-center text-3xl font-bold;
  }

  li {
    @apply flex items-center gap-4;
  }

  #pricing-table {
    @apply rounded-2xl border-4 border-neutral-400 shadow-2xl shadow-neutral-900;
    @apply bg-gradient-to-br from-[#0e1526] to-[#0a0f1b];
    @apply hover:shadow-8xl transition-all duration-500 ease-in-out hover:-translate-y-4;
  }

  #purchase {
    @apply my-4 flex w-full items-center justify-center gap-2 p-6 text-3xl font-bold;
  }
</style>
