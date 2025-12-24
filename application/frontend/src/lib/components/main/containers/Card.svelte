<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    color?: string;
    animate?: boolean;
    className?: string;
    upperClass?: string;
    isMouseEntered?: boolean;
    children: Snippet;
  }

  let {color, className, upperClass, animate, isMouseEntered, children}: Props = $props();
</script>

{#if animate}
  <div id="gradient" class:scale-[1.02]={isMouseEntered}></div>
  <div id="card" class={className}>
    {@render children?.()}
  </div>
{:else}
  <div class="group relative transition-all duration-500 ease-in-out {upperClass}">
    <div id="gradient" class={color}></div>
    <div id="card" class={className}>
      {@render children?.()}
    </div>
  </div>
{/if}

<style lang="postcss">
  @reference "$style";

  #gradient {
    @apply via-primary-600 absolute -inset-1 rounded-2xl bg-linear-to-r from-sky-500 via-30% to-purple-700;
    @apply opacity-90 blur transition-all duration-500 ease-in-out group-hover:scale-[1.02];
  }

  #card {
    @apply relative flex h-full w-full flex-col rounded-2xl border-neutral-500 bg-[#070d1f];
  }

  .purple {
    @apply !via-primary-600 !from-blue-500 !to-purple-700;
  }

  .orange {
    @apply !from-orange-500 !via-amber-600 !to-orange-700;
  }

  .blue {
    @apply !from-teal-500 !via-sky-600 !to-blue-700;
  }

  .red {
    @apply !from-pink-500 !via-rose-600 !to-red-700;
  }

  .green {
    @apply !from-lime-500 !via-green-600 !to-emerald-700;
  }
</style>
