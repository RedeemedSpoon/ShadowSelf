<script lang="ts">
  import {onMount, type Snippet} from 'svelte';
  import {circuitPattern} from '$image';
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
    @apply relative h-[1000px] bg-repeat pb-16 pt-16 md:pb-40 md:pt-56;
  }

  section {
    @apply mx-auto flex w-4/5 justify-center lg:w-1/3;
  }
</style>
