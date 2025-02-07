<script lang="ts">
  import type {Snippet} from 'svelte';
  import {fly} from 'svelte/transition';
  import {currentStep} from '$store';

  interface Props {
    children: Snippet;
    finalStep: number;
    respond: () => void;
  }

  let {respond, finalStep, children}: Props = $props();
</script>

<div class="relative w-full md:w-1/2">
  {#key $currentStep}
    <section in:fly={{delay: 500, y: 35, opacity: 0, duration: 500}} out:fly={{y: -35, opacity: 0, duration: 500}}>
      {@render children?.()}
      <button onclick={respond}>{$currentStep !== finalStep ? 'Next →' : 'Finish'}</button>
    </section>
  {/key}
</div>

<style lang="postcss">
  section {
    @apply absolute inset-0 flex flex-col items-center justify-center gap-8;
  }

  button {
    @apply self-end px-8;
  }
</style>
