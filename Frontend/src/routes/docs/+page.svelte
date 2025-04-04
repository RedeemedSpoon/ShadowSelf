<script lang="ts">
  import type {PageData} from './$types';
  import {HTTPMethod} from '$component';
  import {formatCasing} from '$format';

  let {data}: {data: PageData} = $props();

  function scrollTo(id: string) {
    window.location.hash = id.replace(/\s/g, '-');
  }
</script>

<svelte:head>
  <title>ShadowSelf - API Documentation</title>
  <meta name="description" content="Make use of the ShadowSelf API to interact with our services programmatically with ease" />
</svelte:head>

<div id="docs">
  <ol class="max-h-[calc(100vh-12.5rem)]">
    {#each data.docs.sections as section}
      {@const Icon = section.icon}
      <ul class="mb-2 mt-6">
        <li class="flex items-center gap-2 !text-3xl !text-neutral-300">
          <Icon className="h-8 w-8 !stroke-neutral-300" fill={false} />
          {formatCasing(section.title)}
        </li>
        {#each section.more as subsection}
          <li onclick={() => scrollTo(subsection.title)} class="my-[8px] ml-10">
            <HTTPMethod method={subsection.method} />
            {formatCasing(subsection.title)}
          </li>
        {/each}
      </ul>
    {/each}
  </ol>
  <span class="mr-12 w-px self-stretch bg-neutral-700"></span>
  <section class="flex w-full flex-col gap-8 self-stretch">
    <h1 class="basic-style text-6xl">API Documentation</h1>
    {#each data.docs.content as content}
      {@const Icon = content.icon}
      <h3 id={content.title.replace(/\s/g, '-')} class="flex items-center gap-2 text-5xl text-neutral-300">
        <Icon className="h-12 w-12 !stroke-neutral-300" fill={false} />
        {formatCasing(content.title)}
      </h3>
      <p>{content.description}</p>
      <hr />
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
</style>
