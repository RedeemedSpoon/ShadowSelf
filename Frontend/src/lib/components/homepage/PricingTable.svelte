<script lang="ts">
  import {CheckmarkIcon, ChevronIcon, QuestionIcon} from '$icon';
  import {changePricingModel} from '$lib';
  import {fly} from 'svelte/transition';
  import {pricingModel} from '$store';
  import {Card} from '$component';

  const title = [
    'You can manage your identities and online account linked to it such as passwords and credentials',
    'You get a 14-day money-back guarantee, during which you can request a refund.',
    'You can email us at anytime and we will assist you with any questions or issues you may have.',
  ];
</script>

<div class="mb-16 flex flex-col items-center gap-4 max-sm:-mb-48 max-sm:scale-[65%]">
  <h1>Select Your Plan</h1>
  <p class="max-w-xl text-balance text-center">
    We're not fans of subscriptions either, but someone's gotta pay the bills. Our lifetime plan is a fair deal.
  </p>
  <div id="pricing-model">
    <div id="select-model-box"></div>
    {#each ['Monthly', 'Annually', 'Lifetime'] as model}
      <button class:!text-neutral-300={model === $pricingModel.name} onclick={() => changePricingModel(model)}>
        {model}
      </button>
    {/each}
  </div>
</div>

<Card className="!border-2 !border-neutral-400" upperClass="max-sm:scale-[0.65] max-lg:scale-75 hover:-translate-y-4">
  <div class="flex flex-col items-center gap-8 px-8 py-6 text-center max-sm:px-16 md:items-start md:px-16">
    {#key $pricingModel.price}
      <div in:fly={{x: -30, duration: 1000, opacity: 0}}>
        <h2 class="mb-4 mt-9 text-4xl font-bold text-neutral-300 md:text-left">{$pricingModel.title}</h2>
        <div class="flex items-baseline gap-3 max-md:justify-center">
          <h1 class="text-primary-600 flex items-start gap-1 text-6xl">
            <span class="mt-6 text-4xl">$</span>{$pricingModel.price}
          </h1>
          <p class="text-xl text-neutral-400">{$pricingModel.description}</p>
        </div>
      </div>
    {/key}
    <div class="flex gap-6 py-6 text-left text-xl leading-10 max-sm:flex-col">
      <ul>
        <li><CheckmarkIcon />Custom Identity</li>
        <li><CheckmarkIcon />Email Address</li>
        <li><CheckmarkIcon />Phone Number</li>
      </ul>
      <ul>
        <li><CheckmarkIcon />Virtual Card</li>
        <li><CheckmarkIcon />Crypto Wallet</li>
        <li><CheckmarkIcon />VPN Access</li>
      </ul>
      <ul>
        <li><CheckmarkIcon />Account Management<span title={title[0]}><QuestionIcon /></span></li>
        <li><CheckmarkIcon />14 Day Refund<span title={title[1]}><QuestionIcon /></span></li>
        <li><CheckmarkIcon />24/7 Support<span title={title[2]}><QuestionIcon /></span></li>
      </ul>
    </div>
    <p class="-my-4 text-sm text-neutral-500">All major crypto currencies are supported.</p>
  </div>
  <a href="/signup">
    <button id="purchase">Purchase<ChevronIcon className="!w-10 !h-10" /></button>
  </a>
</Card>

<style lang="postcss">
  #purchase {
    @apply from-primary-700 to-primary-800 bg-gradient-to-b shadow-none;
    @apply w-full rounded-none rounded-b-xl border-t-2 border-neutral-400 text-center text-3xl font-bold;
    @apply mt-8 flex w-full items-center justify-center gap-1 p-8 text-4xl font-bold;
  }

  #pricing-model {
    @apply relative m-4 flex rounded-full border-2 border-neutral-300 bg-neutral-950/50 shadow-xl shadow-neutral-900;
  }

  #pricing-model button {
    @apply bg-none px-10 py-6 text-2xl font-medium text-neutral-500 shadow-xl hover:text-neutral-600;
  }

  #select-model-box {
    @apply absolute left-0 h-full w-1/3 rounded-full bg-neutral-300 bg-opacity-15 transition-all duration-300 ease-in-out;
  }

  ul {
    @apply flex list-inside flex-col flex-nowrap md:mx-8;
  }

  li {
    @apply inline-flex flex-nowrap items-center justify-start gap-4 text-nowrap;
  }

  span {
    @apply cursor-pointer;
  }
</style>
