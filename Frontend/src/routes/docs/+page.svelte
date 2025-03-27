<script lang="ts">
  import {RocketIcon, ChevronIcon} from '$icon';
</script>

<svelte:head>
  <title>ShadowSelf - API Documentation</title>
  <meta name="description" content="Make use of the ShadowSelf API to interact with our services programmatically with ease" />
</svelte:head>

<div id="docs">
  <h1>Coming Soon<RocketIcon /></h1>
  <p class="text-center">
    We're working diligently to bring you the full ShadowSelf experience. While we're currently in the alpha phase, the complete
    version will be available on <b>April 6th</b>. Stay tuned for the launch!
  </p>
  <a href="/"><button class="flex items-center gap-1">Go Home<ChevronIcon /></button></a>
</div>

<style lang="postcss">
  #docs {
    @apply mx-auto my-[15rem] flex min-h-[40vh] w-5/6 flex-col items-center justify-center gap-8 text-neutral-400 md:w-1/2;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }
</style>
