<script lang="ts">
  import {fetchIndex} from '$store';

  interface Props {
    index?: number;
    skip?: boolean;
    type?: 'card' | 'button';
    size?: 'big' | 'small';
    primaryColor?: boolean;
  }

  const {primaryColor, type = 'button', index = 1, skip = false, size = 'small'}: Props = $props();
</script>

{#if skip || $fetchIndex === index}
  {#if type === 'card'}
    <div class="wrapper">
      <div class="loader" style="--size: 50px">
        {#each Array(5) as _, i}
          <div class="orbe" style="--index: {i}; --size-orbe: 10px"></div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="loader block!" style="--size: {size === 'big' ? '35px' : '15px'}">
      {#each Array(5) as _, i}
        <div
          class="orbe orbe-alt {primaryColor && 'after:bg-primary-600!'}"
          style="--index: {i}; --size-orbe-alt: {size === 'big' ? '8px' : '4px'}">
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style lang="postcss">
  @reference "tailwindcss";

  .wrapper {
    @apply absolute z-30 flex h-full w-full items-center justify-center rounded-xl bg-black/40;
  }

  .loader {
    @apply relative rotate-45;
    height: var(--size);
    width: var(--size);
  }

  .orbe {
    @apply animate-orbit absolute h-full w-full opacity-[calc(1-calc(0.05*var(--index)))];
  }

  .orbe::after {
    @apply absolute left-0 top-0 rounded-full;
    @apply bg-primary-600 shadow-primary-700 shadow-[0px_0px_20px_2px] content-[''];
    height: var(--size-orbe);
    width: var(--size-orbe);
  }

  .orbe-alt::after {
    @apply bg-neutral-300 shadow-none;
    height: var(--size-orbe-alt);
    width: var(--size-orbe-alt);
  }
</style>
