<script lang="ts">
  import {fetching} from '$store';

  interface Props {
    index: number;
    type?: 'card' | 'button';
  }

  const {type = 'button', index = 1}: Props = $props();
</script>

{#if $fetching === index}
  {#if type === 'card'}
    <div class="wrapper">
      <div class="loader">
        {#each Array(5) as _, i}
          <div class="orbe" style="--index: {i}"></div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="loader !block !h-[15px] !w-[15px]">
      {#each Array(5) as _, i}
        <div class="orbe orbe-alt" style="--index: {i}"></div>
      {/each}
    </div>
  {/if}
{/if}

<style lang="postcss">
  .wrapper {
    @apply absolute z-30 flex h-full w-full items-center justify-center rounded-xl bg-black/40;
  }

  .loader {
    @apply relative h-[50px] w-[50px] rotate-45;
  }

  .orbe {
    @apply animate-orbit absolute h-full w-full opacity-[calc(1-calc(0.05*var(--index)))];
  }

  .orbe::after {
    @apply absolute left-0 top-0 h-[10px] w-[10px] rounded-full;
    @apply bg-primary-600 shadow-primary-700 shadow-[0px_0px_20px_2px] content-[''];
  }

  .orbe-alt::after {
    @apply h-[4px] w-[4px] bg-neutral-300 shadow-none;
  }
</style>
