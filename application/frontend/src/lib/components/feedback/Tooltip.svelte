<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    children: Snippet;
    nowrap?: boolean;
    onTop?: boolean;
    alt?: boolean;
    tip: string;
  }

  let {onTop = true, alt = false, nowrap, tip, children}: Props = $props();

  const addedClasses = $derived(`${alt ? 'alt ' : ''}${onTop ? 'top-full ' : 'bottom-full '}${nowrap ? 'text-nowrap!' : ''}`);
</script>

<div class="group/tooltip relative w-fit">
  <span class="{addedClasses} group-hover/tooltip:visible! group-hover/tooltip:opacity-100!">{tip}</span>
  {@render children?.()}
</div>

<style lang="postcss">
  @reference "$style";

  span {
    @apply invisible absolute z-30 my-2 rounded-xl px-4 py-3 text-sm text-wrap whitespace-pre-line opacity-0;
    @apply bg-neutral-950/85 text-neutral-300 shadow-black drop-shadow-2xl transition-all duration-200 ease-in-out;
  }

  .alt {
    @apply bg-primary-600 text-primary-100 hover:text-primary-50 shadow-primary-700 -bottom-8 left-1/2 -translate-x-1/2;
  }
</style>
