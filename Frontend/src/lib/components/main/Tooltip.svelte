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
  <div class="{onTop ? 'top-full' : 'bottom-full'} group-hover/tooltip:block">{tip}</div>
  {@render children?.()}
</div>

<style lang="postcss">
  div > div {
    @apply absolute z-20 my-2 hidden rounded-xl bg-neutral-900/95 px-4 py-3 text-sm;
  }
</style>
