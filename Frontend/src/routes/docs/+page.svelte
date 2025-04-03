<script lang="ts">
  import {HTTPMethod, CodeExample} from '$component';
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();
</script>

<svelte:head>
  <title>ShadowSelf - API Documentation</title>
  <meta name="description" content="Make use of the ShadowSelf API to interact with our services programmatically with ease" />
</svelte:head>

<div id="docs">
  <section>
    {#each data.docs.sections as section}
      <ul class="my-2 text-3xl text-neutral-300">{section.title}</ul>
      {#each section.more as subsection}
        <li class="ml-8 text-xl text-neutral-400">{subsection.title}</li>
      {/each}
    {/each}
  </section>
  <section></section>
</div>

<style lang="postcss">
  #docs {
    @apply mx-auto my-[15rem] flex min-h-[40vh] w-5/6 flex-col items-center justify-center gap-8 text-neutral-400 md:w-1/2;
  }
</style>
