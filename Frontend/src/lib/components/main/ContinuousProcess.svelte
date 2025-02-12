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

<div class="w-full">
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
    @apply flex flex-col items-center justify-center gap-8;
  }

  button {
    @apply mr-[5vw] flex items-center justify-center gap-3 self-end text-nowrap px-8;
  }
</style>
