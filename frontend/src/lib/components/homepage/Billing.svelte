<script lang="ts">
  import {CheckmarkIcon, ChevronIcon, QuestionIcon} from '$icon';
  import {user, pricingModel} from '$store';
  import {allPricingModels} from '$type';
  import {fly} from 'svelte/transition';
  import {Card} from '$component';
  import {onMount} from 'svelte';

  function changePricingModel(model: string) {
    const chosenModel = model.toLowerCase() as keyof typeof allPricingModels;
    pricingModel.set({name: model, ...allPricingModels[chosenModel]});

    const margin = model === 'Monthly' ? '0%' : model === 'Annually' ? '33%' : '66%';
    const element = document.querySelector('#select-model-box') as HTMLElement;
    element.style.left = margin;
  }

  const title = [
    'You get a 14-day money-back guarantee, during which you can request a refund.',
    'You can email us at anytime and we will assist you with any questions or issues you may have.',
  ];

  const sections = [
    ['Personal Attributes', 'Email Address', 'Phone Number'],
    ['Virtual Card', 'VPN Access', 'Account Management'],
    ['14 Day Refund', '24/7 Support'],
  ];

  onMount(() => changePricingModel($pricingModel.name));
</script>

<div class="mb-16 flex flex-col items-center gap-4 max-sm:-mb-48 max-sm:scale-[65%]">
  <h1 class="text-center">Select Your Plan</h1>
  <p class="max-w-xl text-balance text-center">
    We're not fans of subscriptions either, but someone's gotta pay the bills. Our lifetime plan is a fair deal.
  </p>
  <div id="pricing-model">
    <div id="select-model-box"></div>
    {#each ['Monthly', 'Annually', 'Lifetime'] as model}
      <button type="button" class:!text-neutral-300={model === $pricingModel.name} onclick={() => changePricingModel(model)}>
        {model}
      </button>
    {/each}
  </div>
</div>

<Card className="border-2! border-neutral-400!" upperClass="max-sm:scale-[0.65] max-lg:scale-75 hover:-translate-y-4">
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
    <div class="flex w-full gap-6 py-6 text-left text-xl leading-10 max-sm:flex-col">
      {#each sections as section, index (index)}
        <ul>
          {#each section as item}
            <li>
              <CheckmarkIcon className="cursor-auto fill-green-500! w-6! h-6!" />
              {item}
              {#if index === 2}
                <span title={title[section.indexOf(item)]}>
                  <QuestionIcon className="cursor-help -ml-2 w-4! h-4! fill-neutral-700!" /></span>
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  </div>
  <a href={$user ? '/purchase' : '/login'}>
    <button id="purchase">Purchase<ChevronIcon /></button>
  </a>
</Card>

<style lang="postcss">
  @reference "$style";

  #purchase {
    @apply rounded-none rounded-b-xl border-t-2 border-neutral-400 shadow-md;
    @apply mt-8 flex w-full items-end justify-center gap-1 p-8 text-4xl font-semibold;
  }

  #pricing-model {
    @apply relative m-4 flex rounded-full border-2 border-neutral-300 bg-neutral-950/50 shadow-xl shadow-neutral-900;
  }

  #pricing-model button {
    @apply bg-none px-10 py-6 text-2xl font-medium text-neutral-500 shadow-none hover:text-neutral-600;
  }

  #select-model-box {
    @apply absolute left-0 h-full w-1/3 rounded-full bg-neutral-300/15 transition-all duration-300 ease-in-out;
  }

  ul {
    @apply flex list-inside flex-col flex-nowrap md:mx-8;
  }

  li {
    @apply inline-flex flex-nowrap items-center justify-start gap-4 text-nowrap;
  }
</style>
