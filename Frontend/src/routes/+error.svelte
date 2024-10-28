<script lang="ts">
  import {page} from '$app/stores';
  import {CheveronImg} from '$components';
  import {circuitPattern, itCrowdGif} from '$images';
</script>

<svelte:head>
  <title>ShadowSelf - Error</title>
  <meta name="robots" content="noindex" />
  <meta name="description" content="ShadowSelf - Error 404 Page" />
</svelte:head>

<section style="background-size: 20%; background-image: url({circuitPattern}); background-repeat: repeat">
  <h1 class="text-7xl">Page Not Found.</h1>
  <img alt={$page.error?.message} src={itCrowdGif} />
  <p>Oops, looks like you hit a dead end! That's not a big deal, Let's get you back on track.</p>
  <a href="/"><button>Go Home<CheveronImg /></button></a>
</section>

<style lang="postcss">
  section {
    @apply flex h-screen w-screen flex-col items-center justify-center gap-8;
  }

  img {
    @apply w-auto rounded-sm border border-2 border-neutral-400 shadow-2xl;
  }

  p {
    @apply w-1/3 text-center text-2xl leading-loose;
  }

  button {
    @apply flex items-center gap-1 px-6 py-5 text-2xl;
  }
</style>
