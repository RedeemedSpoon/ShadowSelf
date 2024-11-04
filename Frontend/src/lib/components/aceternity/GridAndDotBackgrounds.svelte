<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    showFade?: boolean;
    children?: Snippet;
  }

  let {showFade = true, children}: Props = $props();
</script>

<div class="bg-grid-neutral-700 relative flex h-[125&vh] w-[85vw] justify-center bg-transparent lg:h-[70vh]">
  {#if showFade}
    <div class="absolute inset-0 bg-neutral-900 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]">
    </div>
  {/if}
  <div class="relative flex h-3/4 w-2/3 flex-col items-center justify-center gap-4 max-sm:scale-90">
    {@render children?.()}
  </div>
</div>
