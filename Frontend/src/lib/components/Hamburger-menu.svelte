<script lang="ts">
  import {selectionMenuOpen} from '$store';

  export let className: string | undefined = undefined;
</script>

<div class="hidden max-lg:block">
  <svg
    on:click={() => ($selectionMenuOpen = !$selectionMenuOpen)}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    class={'small-icon small-aura ' + className}
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
  <div class={$selectionMenuOpen ? '!visible !-translate-x-12 !opacity-100' : ''} id="humberger-menu-container">
    <slot />
  </div>
</div>
<div class="ml-6 flex gap-4 max-lg:hidden">
  <slot />
</div>

<style lang="postcss">
  #humberger-menu-container {
    @apply invisible absolute -right-12 top-24 !z-[1000] translate-x-0 opacity-0 transition-all duration-300 ease-in-out sm:-right-24;
    @apply rounded-2xl border-2 border-neutral-700 bg-neutral-950 bg-opacity-75 p-8 backdrop-blur-md;
    @apply flex flex-col-reverse items-center justify-center gap-6 md:flex-row;
  }
</style>
