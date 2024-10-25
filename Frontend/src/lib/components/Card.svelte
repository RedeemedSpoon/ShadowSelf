<script lang="ts">
  export let className: string = '';
  export let animate: boolean = false;
  export let upperClass: string = '';
</script>

{#if animate}
  <div id="gradient" class:animate-shake={animate} />
  <div id="card" class:animate-shake={animate} class={className}>
    <slot />
  </div>
{:else}
  <div class="relative transition-all duration-500 ease-in-out {upperClass}">
    <div id="gradient" />
    <div id="card" class={className}>
      <slot />
    </div>
  </div>
{/if}

<style lang="postcss">
  #gradient {
    @apply via-primary-600 absolute -inset-2 rounded-2xl bg-gradient-to-r from-sky-500 via-30% to-purple-700 opacity-75 blur;
  }

  #card {
    @apply relative flex h-full w-full flex-col rounded-2xl border border-neutral-500 bg-neutral-950;
  }
</style>
