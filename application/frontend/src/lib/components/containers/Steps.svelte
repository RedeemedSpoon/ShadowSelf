<script lang="ts">
  import circuitPattern from '$image/patterns/circuit-pattern.svg';
  import {onMount, type Snippet} from 'svelte';
  import {fly} from 'svelte/transition';
  import {currentStep} from '$store';

  let {children}: {children: Snippet} = $props();
  onMount(() => currentStep.set(1));
</script>

<div id="steps" style="background-image: url({circuitPattern})">
  <div class="absolute w-full">
    {#key $currentStep}
      <section in:fly={{delay: 500, x: 35, opacity: 0, duration: 500}} out:fly={{x: -35, opacity: 0, duration: 500}}>
        {@render children?.()}
      </section>
    {/key}
  </div>
</div>

<style lang="postcss">
  @reference "$style";

  #steps {
    @apply relative h-250 bg-repeat pt-16 pb-16 md:pt-56 md:pb-40;
  }

  section {
    @apply mx-auto flex w-4/5 justify-center lg:w-1/3;
  }
</style>
