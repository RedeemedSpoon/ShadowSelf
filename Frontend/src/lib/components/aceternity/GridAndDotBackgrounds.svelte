<script lang="ts">
  export let showFade: boolean = true;
</script>

<div class="bg-grid-neutral-700 relative flex h-[70vh] w-[85vw] justify-center bg-transparent">
  {#if showFade}
    <div
      class="absolute inset-0 bg-neutral-900 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]" />
  {/if}
  <div class="relative flex h-3/4 w-2/3 flex-col items-center justify-center gap-4">
    <slot />
  </div>
</div>
