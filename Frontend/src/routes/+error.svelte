<script lang="ts">
  import {page} from '$app/stores';
  import {CheveronImg} from '$components';
  import {circuitPattern} from '$images';
</script>

<svelte:head>
  <title>ShadowSelf - Error</title>
  <meta name="robots" content="noindex" />
  <meta name="description" content="ShadowSelf - Error 404 Page" />
</svelte:head>

<section style="background-size: 20%; background-image: url({circuitPattern}); background-repeat: repeat">
  <h1 class="text-5xl md:text-7xl">Page Not Found.</h1>
  <img alt={$page.error?.message} src="404-error.gif" />
  <p>Oops, looks like you hit a dead end! That's not a big deal, Let's get you back on track.</p>
  <a href="/"><button>Go Home<CheveronImg /></button></a>
</section>

<style lang="postcss">
  section {
    @apply flex h-screen w-screen flex-col items-center justify-center gap-8 text-center;
  }

  img {
    @apply w-3/4 rounded-xl border-2 border-neutral-400 shadow-2xl md:w-auto;
  }

  p {
    @apply w-1/2 text-xl leading-relaxed md:w-1/3 md:text-2xl md:leading-loose;
  }

  button {
    @apply flex items-center gap-1 px-6 py-5 text-2xl;
  }
</style>
