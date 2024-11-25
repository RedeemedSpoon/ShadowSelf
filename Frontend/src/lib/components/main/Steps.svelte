<script lang="ts">
  import {onMount, type Snippet} from 'svelte';
  import {circuitPattern} from '$image';
  import {fly} from 'svelte/transition';
  import {currentStep} from '$store';

  let {children}: {children: Snippet} = $props();

  const progressStep = [{Account: 1}, {'2FA': 2}, {Billing: 6}, {Done: 8}];

  onMount(() => currentStep.set(1));
</script>

<div style="background-image: url({circuitPattern}); background-repeat: repeat">
  <section class="relative top-[10rem] flex w-full justify-center gap-20">
    {#each progressStep as stepbar, index (index)}
      <div class="flex flex-col items-center gap-4">
        <div class="bg-primary-600 h-6 w-6 rounded-full"></div>
        <p>{Object.keys(stepbar)}</p>
      </div>
    {/each}
  </section>
  {#key $currentStep}
    <section
      class="mx-auto flex h-fit w-1/3 justify-center gap-12 pb-[10rem] pt-[15rem]"
      in:fly={{delay: 500, x: 100, opacity: 0, duration: 500}}
      out:fly={{x: -100, opacity: 0, duration: 500}}>
      {@render children?.()}
    </section>
  {/key}
</div>
