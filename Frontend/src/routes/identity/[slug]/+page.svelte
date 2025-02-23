<script lang="ts">
  import {RocketIcon, ChevronIcon} from '$icon';
  import type {PageProps} from './$types';

  let {data}: PageProps = $props();
  console.log(data);
</script>

<svelte:head>
  <title>ShadowSelf - Browser Extension</title>
  <meta name="description" content="Take control of your identity, personalize your preferences, and protect your privacy here." />
</svelte:head>

<div id="identity">
  {#if data.identity}
    <h1>Coming Soon<RocketIcon /></h1>
    <p class="text-center">
      This section is currently under active development. The first beta release is scheduled for <b>March 9</b> and the full release
      is scheduled for <b>April 27</b>. Stay tuned for the exciting updates!
    </p>
    <p><b>Identity ID</b> : {data.slug}</p>
    <a href="/dashboard"><button class="flex items-center gap-1">Dashboard<ChevronIcon /></button></a>
  {:else}
    <h1>Identity Not Found</h1>
    <p class="text-center">
      The identity you're looking for doesn't exist, or your account isn't the owner.
      <br class="max-lg:hidden" /> Please verify the URL and try again.
    </p>
    <a href="/dashboard"><button class="flex items-center gap-1">Dashboard<ChevronIcon /></button></a>
  {/if}
</div>

<style lang="postcss">
  #identity {
    @apply mx-auto my-[15rem] flex min-h-[40vh] w-5/6 flex-col items-center justify-center gap-8 text-neutral-400 md:w-1/2;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }
</style>
