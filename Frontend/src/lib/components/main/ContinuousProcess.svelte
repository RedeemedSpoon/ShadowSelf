<script lang="ts">
  import {Loader} from '$component';
  import type {Snippet} from 'svelte';
  import {slide} from 'svelte/transition';
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
    <section in:slide={{delay: 500, duration: 500}} out:slide={{duration: 500}}>
      {@render children?.()}
      {#if $currentStep !== finalStep}
        <button onclick={handleClick} disabled={$fetching === 1 || disabled}>
          {$fetching === 1 ? 'Next' : 'Next →'}
          <Loader index={1} />
        </button>
      {/if}
    </section>
  {/key}
</div>

<style lang="postcss">
  section {
    @apply flex flex-col items-center justify-center gap-8 border-y border-neutral-600 py-12;
  }

  button {
    @apply flex items-center justify-center gap-3 self-end text-nowrap px-8 max-sm:mt-8 max-sm:w-3/4 max-sm:self-center sm:mr-[8.5vw];
  }
</style>
