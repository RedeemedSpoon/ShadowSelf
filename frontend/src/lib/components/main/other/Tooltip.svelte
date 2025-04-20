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

  let addedClaseses = $state(alt ? 'alt ' : '');
  addedClaseses += onTop ? 'top-full ' : 'bottom-full ';
  addedClaseses += nowrap ? '!text-nowrap' : '';
</script>

<div class="group/tooltip relative w-fit">
  <span class="{addedClaseses} group-hover/tooltip:visible group-hover/tooltip:opacity-100">{tip}</span>
  {@render children?.()}
</div>

<style lang="postcss">
  span {
    @apply invisible absolute z-30 my-2 whitespace-pre-line text-wrap rounded-xl px-4 py-3 text-sm opacity-0;
    @apply bg-neutral-950/85 text-neutral-300 shadow-black drop-shadow-2xl transition-all duration-200 ease-in-out;
  }

  .alt {
    @apply bg-primary-600 text-primary-100 hover:text-primary-50 shadow-primary-700 -bottom-8 left-1/2 -translate-x-1/2;
  }
</style>
