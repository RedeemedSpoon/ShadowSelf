<script lang="ts">
  import {Loader} from '$component';
  import type {Snippet} from 'svelte';
  import {fly} from 'svelte/transition';
  import {fetching, currentStep} from '$store';

  interface Props {
    children: Snippet;
    finalStep: number;
    disabled: boolean;
    handleClick: () => void;
  }

  let {handleClick, disabled, finalStep, children}: Props = $props();
</script>

<div class="relative w-full md:w-1/2">
  {#key $currentStep}
    <section in:fly={{delay: 500, y: 35, opacity: 0, duration: 500}} out:fly={{y: -35, opacity: 0, duration: 500}}>
      {@render children?.()}
      <button onclick={handleClick} disabled={$fetching === 1 || disabled}>
        {$currentStep !== finalStep ? ($fetching === 1 ? 'Next' : 'Next →') : 'Finish'}
        <Loader index={1} />
      </button>
    </section>
  {/key}
</div>

<style lang="postcss">
  section {
    @apply absolute inset-0 flex flex-col items-center justify-center gap-8;
  }

  button {
    @apply flex items-center justify-center gap-3 self-end text-nowrap px-8;
  }
</style>
