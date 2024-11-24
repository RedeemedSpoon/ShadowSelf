<script lang="ts">
  import {currentStep} from '$store';
  import type {Snippet} from 'svelte';
  import {fly} from 'svelte/transition';
  import {circuitPattern} from '$images';

  let {children}: {children: Snippet} = $props();
</script>

{#key $currentStep}
  <div
    style="background-image: url({circuitPattern})"
    in:fly={{delay: 500, x: 100, opacity: 0, duration: 500}}
    out:fly={{x: -100, opacity: 0, duration: 500}}>
    {@render children?.()}
  </div>
{/key}

<style lang="postcss">
  div {
    @apply mx-auto flex h-screen w-full justify-center gap-12 bg-repeat;
  }
</style>
