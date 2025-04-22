<script lang="ts">
  import {fetchIndex, currentStep} from '$store';
  import {fly} from 'svelte/transition';
  import type {Snippet} from 'svelte';
  import {Loader} from '$component';

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
    <section in:fly={{delay: 500, y: 35, duration: 500}} out:fly={{y: -35, duration: 500}}>
      {@render children?.()}
      {#if $currentStep !== finalStep}
        <button onclick={handleClick} disabled={$fetchIndex === 1 || disabled}>
          {$fetchIndex === 1 ? 'Next' : 'Next →'}
          <Loader index={1} />
        </button>
      {/if}
    </section>
  {/key}
</div>

<style lang="postcss">
  @reference "tailwindcss";

  section {
    @apply flex flex-col items-center justify-center gap-8 py-12;
  }

  button {
    @apply flex items-center justify-center gap-3 self-end text-nowrap px-8 max-sm:mt-8 max-sm:w-3/4 max-sm:self-center sm:mr-[8.5vw];
  }

  .w-full > section:not(:first-child) {
    display: none !important;
  }
</style>
