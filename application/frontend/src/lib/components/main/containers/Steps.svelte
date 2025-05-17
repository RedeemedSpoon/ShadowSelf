<script lang="ts">
  import {onMount, type Snippet} from 'svelte';
  import {circuitPattern} from '$image';
  import {fly} from 'svelte/transition';
  import {currentStep} from '$store';

  let {children}: {children: Snippet} = $props();

  onMount(() => currentStep.set(1));
</script>

<div style="background-image: url({circuitPattern})">
  {#key $currentStep}
    <section in:fly={{delay: 500, x: 35, opacity: 0, duration: 500}} out:fly={{x: -35, opacity: 0, duration: 500}}>
      {@render children?.()}
    </section>
  {/key}
</div>

<style lang="postcss">
  @reference "$style";

  div {
    @apply h-full bg-repeat pb-[6rem] pt-[9rem] md:pb-[10rem] md:pt-[15rem];
  }

  section {
    @apply mx-auto flex h-fit w-4/5 justify-center gap-12 lg:w-1/3;
  }
</style>
