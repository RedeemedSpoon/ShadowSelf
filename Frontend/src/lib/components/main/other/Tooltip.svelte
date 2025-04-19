<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    children: Snippet;
    onTop?: boolean;
    nowrap?: boolean;
    tip: string;
  }

  let {onTop = true, nowrap, tip, children}: Props = $props();
</script>

<div class="group/tooltip relative">
  <span class="{onTop ? 'top-full' : 'bottom-full'} {nowrap && '!text-nowrap'} group-hover/tooltip:block">{tip}</span>
  {@render children?.()}
</div>

<style lang="postcss">
  span {
    @apply absolute z-30 my-2 hidden text-wrap rounded-xl px-4 py-3 text-sm;
    @apply bg-neutral-950/85 text-neutral-300 shadow-black drop-shadow-2xl;
  }
</style>
