<script lang="ts">
  import {selectionMenuOpen} from '$store';
  import type {Snippet} from 'svelte';

  interface Props {
    className?: string | undefined;
    children?: Snippet;
  }

  let {className, children}: Props = $props();
</script>

<div class="hidden max-lg:block">
  <svg
    onclick={() => ($selectionMenuOpen = !$selectionMenuOpen)}
    class={'small-icon small-aura ' + className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 6l16 0" />
    <path d="M4 12l16 0" />
    <path d="M4 18l16 0" />
  </svg>
  <div class={$selectionMenuOpen ? 'visible! -translate-x-12! opacity-100!' : ''} id="humberger-menu-container">
    {@render children?.()}
  </div>
</div>
<div class="ml-6 flex gap-4 max-lg:hidden">
  {@render children?.()}
</div>

<style lang="postcss">
  @reference "tailwindcss";

  #humberger-menu-container {
    @apply z-1000! invisible absolute -right-12 top-24 translate-x-0 opacity-0 transition-all duration-300 ease-in-out sm:-right-24;
    @apply rounded-2xl border-2 border-neutral-700 bg-neutral-950 bg-opacity-75 p-8 backdrop-blur-md;
    @apply flex flex-col-reverse items-center justify-center gap-6 md:flex-row;
  }
</style>
