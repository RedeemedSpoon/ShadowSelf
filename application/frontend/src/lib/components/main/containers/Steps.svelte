<script lang="ts">
  import {onMount, type Snippet} from 'svelte';
  import {circuitPattern} from '$image';
  import {fly} from 'svelte/transition';
  import {currentStep} from '$store';

  let {children}: {children: Snippet} = $props();

  let div = $state() as HTMLDivElement;
  onMount(() => currentStep.set(1));
</script>

<div style="background-image: url({circuitPattern})">
  {#key $currentStep}
    <section
      style="height: {div?.clientHeight}px !important;"
      in:fly={{delay: 500, x: 35, opacity: 0, duration: 500}}
      out:fly={{x: -35, opacity: 0, duration: 500}}>
      <div class="absolute h-0" bind:this={div}>
        {@render children?.()}
      </div>
    </section>
  {/key}
</div>

<style lang="postcss">
  @reference "$style";

  div {
    @apply h-full bg-repeat pb-16 pt-16 md:pb-24 md:pt-28;
  }

  section {
    @apply mx-auto flex h-fit w-4/5 justify-center gap-12 lg:w-1/3;
  }
</style>
