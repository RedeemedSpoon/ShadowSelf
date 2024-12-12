<script lang="ts">
  import {ChevronIcon} from '$icon';
  import {page} from '$app/stores';
</script>

<svelte:head>
  <title>ShadowSelf - Error</title>
  <meta name="robots" content="noindex" />
  <meta name="description" content="Error 404 page not found" />
</svelte:head>

<section>
  <img alt={$page.error?.message} src="/404-error.gif" />
  <h1 class="basic-style text-4xl md:text-6xl">Page Not Found.</h1>
  <p>
    It appears the page you're looking for doesn’t exist. This could be a spelling typo, a small mistake in the URL or a broken link.
    Let’s go back and give it another shot.
  </p>
  <a href="/"><button>Go Home<ChevronIcon /></button></a>
</section>

<style lang="postcss">
  section {
    @apply my-[10rem] flex h-fit w-screen flex-col items-center justify-center gap-8 text-center;
  }

  img {
    @apply w-3/4 rounded-lg border-2 border-neutral-400 shadow-2xl md:w-auto;
  }

  p {
    @apply w-1/2 text-xl leading-relaxed md:w-1/3 md:text-xl md:leading-loose;
  }

  button {
    @apply flex items-center gap-1;
  }
</style>
