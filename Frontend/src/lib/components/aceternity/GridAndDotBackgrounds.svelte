<script lang="ts">
  export let showFade: boolean = true;
</script>

<div class="bg-grid-neutral-600 relative flex h-[70vh] w-[90vw] justify-center bg-transparent">
  {#if showFade}
    <div class="absolute inset-0 bg-neutral-900 [mask-image:radial-gradient(ellipse_at_center,transparent,black)]">
    </div>
  {/if}
  <slot />
</div>
