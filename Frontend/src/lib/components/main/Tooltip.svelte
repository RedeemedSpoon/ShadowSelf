<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    children: Snippet;
    onTop?: boolean;
    tip: string;
  }

  let {onTop = true, tip, children}: Props = $props();
</script>

<div class="group/tooltip relative">
  <span class="{onTop ? 'top-full' : 'bottom-full'} group-hover/tooltip:block">{tip}</span>
  {@render children?.()}
</div>

<style lang="postcss">
  span {
    @apply absolute z-20 my-2 hidden text-wrap rounded-xl bg-neutral-900/95 px-4 py-3 text-sm shadow-black drop-shadow-2xl;
  }
</style>
