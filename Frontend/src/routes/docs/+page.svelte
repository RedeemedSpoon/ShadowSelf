<script lang="ts">
  import type {PageData} from './$types';
  import {HTTPMethod} from '$component';
  import {formatCasing} from '$format';
  import {page} from '$app/state';

  let {data}: {data: PageData} = $props();

  let anchor = $state(page.url.hash?.slice(1));

  const scrollTo = (hash: string) => {
    window.location.hash = hash;
    anchor = hash;
  };
</script>

<svelte:head>
  <title>ShadowSelf - API Documentation</title>
  <meta name="description" content="Make use of the ShadowSelf API to interact with our services programmatically with ease" />
</svelte:head>

<div id="docs">
  <ol class="max-h-[calc(100vh-12.5rem)]">
    {#each data.docs.sections as section}
      {@const Icon = section.icon}
      <ul class="mt-6">
        <li class="title mb-3 flex items-center gap-2 !text-3xl !text-neutral-300">
          <Icon className="h-8 w-8 cursor-default !stroke-neutral-300" fill={false} />
          {formatCasing(section.title)}
        </li>
        {#each section.more as subsection}
          {@const hash = subsection.title.replace(/\s/g, '-')}
          <li aria-hidden="true" onclick={() => scrollTo(hash)} class={anchor === hash ? 'anchor' : ''}>
            <HTTPMethod method={subsection.method} />
            {formatCasing(subsection.title)}
          </li>
        {/each}
      </ul>
    {/each}
  </ol>
  <span class="mr-12 w-0.5 self-stretch bg-neutral-700"></span>
  <section id="content" class="flex w-full flex-col gap-8 self-stretch">
    <h1 class="basic-style text-6xl">API Documentation</h1>
    {#each data.docs.content as content, i}
      {@const Icon = content.icon}
      {@const Description = content.description}
      <h2 class="flex items-center gap-2 text-5xl text-neutral-300">
        <Icon className="h-14 w-14 !stroke-neutral-300 cursor-default" fill={false} />
        {formatCasing(content.title)}
      </h2>
      <Description />
      {#if i !== data.docs.content.length - 1}
        <hr class="bg-neutral-7002 my-6" />
      {/if}
    {/each}
  </section>
</div>

<style lang="postcss">
  #docs {
    @apply mx-auto my-[12.5rem] flex w-5/6 text-neutral-400;
  }

  ol {
    @apply no-scrollbar sticky top-36 flex flex-shrink-0 flex-col self-start overflow-y-auto pr-12;
  }

  li {
    @apply text-nowrap text-xl text-neutral-400;
  }

  ol li:not(.title) {
    @apply my-1 ml-10 w-fit cursor-pointer select-none px-4 py-2 transition-all duration-300 ease-in-out;
    @apply rounded-full hover:bg-neutral-300/10;
  }

  .anchor {
    @apply bg-neutral-300/20 hover:!bg-neutral-300/20;
  }

  :global(#content h3) {
    @apply border-primary-700 w-fit scroll-mt-[12.5rem] border-b-2 pb-4 text-4xl text-neutral-300;
  }

  :global(#content code) {
    @apply rounded-xl bg-neutral-800 px-2 font-mono text-lg;
  }

  :global(#content b) {
    @apply text-neutral-300;
  }

  :global(#content li) {
    @apply my-3 ml-8 list-disc;
  }

  :global(#content ul) {
    @apply -my-3;
  }
</style>
