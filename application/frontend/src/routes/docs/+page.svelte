<script lang="ts">
  import {formatCasing, formatToMarkdown} from '$format';
  import 'highlight.js/styles/tokyo-night-dark.css';
  import {APICode, HTTPMethod} from '$component';
  import {CopyIcon, CheckmarkIcon} from '$icon';
  import type {PageData} from './$types';
  import {page} from '$app/state';
  import hljs from 'highlight.js';
  import {onMount} from 'svelte';

  // @ts-expect-error No declaration file
  import curl from 'highlightjs-curl';
  import go from 'highlight.js/lib/languages/go';
  import rust from 'highlight.js/lib/languages/rust';
  import json from 'highlight.js/lib/languages/json';
  import python from 'highlight.js/lib/languages/python';
  import javascript from 'highlight.js/lib/languages/javascript';

  hljs.configure({ignoreUnescapedHTML: true});
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('curl', curl);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('rust', rust);
  hljs.registerLanguage('go', go);

  let {data}: {data: PageData} = $props();

  let anchor = $state(page.url.hash?.slice(1));
  let copiedGlobal = $state(false);
  let copiedSections = $state<Record<string, boolean>>({});

  let mainContentRef: HTMLElement;
  let sectionRefs: Record<string, HTMLElement> = {};

  const scrollTo = (hash: string) => {
    if (hash) window.location.hash = hash;
    anchor = hash;
  };

  const copyToMarkdown = async (element: HTMLElement, sectionId?: string) => {
    const markdown = formatToMarkdown(element);
    await navigator.clipboard.writeText(markdown);

    if (sectionId) {
      copiedSections[sectionId] = true;
      setTimeout(() => (copiedSections[sectionId] = false), 2000);
    } else {
      copiedGlobal = true;
      setTimeout(() => (copiedGlobal = false), 2000);
    }
  };

  onMount(() => {
    hljs.highlightAll();
    scrollTo(page.url.hash?.slice(1));
  });
</script>

<svelte:head>
  <title>ShadowSelf - API Documentation</title>
  <meta name="description" content="Make use of the ShadowSelf API to interact with our services programmatically with ease" />
</svelte:head>

<div id="docs">
  <aside class="sidebar">
    <ol>
      {#each data.docs.sections as section (section.title)}
        {@const Icon = section.icon}
        <ul class="mb-8">
          <li class="title mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-neutral-300 uppercase">
            <Icon className="h-5 w-5 stroke-neutral-400" fill={false} />
            {formatCasing(section.title)}
          </li>
          {#each section.more as subsection (subsection.title)}
            {@const hash = subsection.title.replace(/\s/g, '-')}
            <li aria-hidden="true" onclick={() => scrollTo(hash)} class="{anchor === hash && 'anchor'} my-1 flex items-center gap-2">
              <HTTPMethod method={subsection.method} />
              <span class="truncate">{formatCasing(subsection.title)}</span>
            </li>
          {/each}
        </ul>
      {/each}
    </ol>
  </aside>

  <main id="content" bind:this={mainContentRef}>
    <div class="mb-12 flex items-center justify-between">
      <h1 class="text-3xl! font-bold! text-neutral-100 md:text-4xl!">API Documentation</h1>
      <button class="flex items-center gap-2 text-base" onclick={() => copyToMarkdown(mainContentRef)}>
        {#if copiedGlobal}
          <CheckmarkIcon className="h-4 w-4" />
          <span>Copied Markdown</span>
        {:else}
          <CopyIcon className="h-4 w-4 fill-none" />
          <span>Copy Full Docs for LLMs</span>
        {/if}
      </button>
    </div>

    {#each data.docs.content as content, i (content.title)}
      {@const Icon = content.icon}
      <div bind:this={sectionRefs[content.title]}>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="flex items-center gap-3 text-2xl font-semibold text-neutral-200 md:text-3xl!">
            <Icon className="h-8 w-8 stroke-neutral-200" fill={false} />
            {formatCasing(content.title)}
          </h2>
          <button
            class="alt flex items-center gap-2 px-2 py-1 text-sm"
            onclick={() => copyToMarkdown(sectionRefs[content.title], content.title)}
            title="Copy this section as Markdown for LLM">
            {#if copiedSections[content.title]}
              <CheckmarkIcon className="h-3.5 w-3.5" />
              <span>Copied</span>
            {:else}
              <CopyIcon className="h-3.5 w-3.5 fill-none" />
              <span>Copy Markdown for LLMs</span>
            {/if}
          </button>
        </div>

        <div class="mb-12">
          {#if typeof content.description === 'function'}
            {@const Description = content.description}
            {#if content.title === 'websocket' || content.title === 'proxy'}
              <Description>
                <APICode {hljs} alt={content.routes} title={content.title} />
              </Description>
            {:else}
              <Description />
            {/if}
          {:else}
            <p>{content.description}</p>
          {/if}
        </div>

        {#if content.routes}
          <div class="mt-10 mb-8 flex flex-col">
            {#each content.routes as route (route.title)}
              {@const RouteDescription = route.description}
              <div class="flex flex-col gap-8 xl:flex-row xl:items-start">
                <section class="route-info xl:w-1/2 xl:pr-8">
                  <h3 class="mb-4" id={route.title.replace(/\s/g, '-')}>
                    {formatCasing(route.title)}:
                  </h3>
                  <div>
                    <RouteDescription />
                  </div>
                </section>
                <section class="flex flex-col xl:sticky xl:top-32 xl:w-1/2">
                  <APICode {hljs} {route} />
                  <APICode {hljs} response={route.response} />
                </section>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      {#if i !== data.docs.content.length - 1}
        <hr class="my-6 bg-neutral-700/50" />
      {/if}
    {/each}
  </main>
</div>

<style lang="postcss">
  @reference "$style";

  #docs {
    @apply mx-auto my-34 flex max-w-360 gap-12 px-4 sm:px-6 lg:px-8;
  }

  .sidebar {
    @apply hidden w-64 shrink-0 lg:block;
  }

  ol {
    @apply no-scrollbar sticky top-32 flex max-h-[calc(100vh-8rem)] flex-col overflow-y-auto pb-8;
  }

  li {
    @apply text-sm text-neutral-400;
  }

  ol li:not(.title) {
    @apply ml-3 cursor-pointer rounded-md px-2 py-1 transition-all duration-200 select-none;
    @apply hover:bg-neutral-800 hover:text-neutral-200;
  }

  .anchor {
    @apply bg-neutral-800 font-medium text-neutral-200;
  }

  #content {
    @apply min-w-0 flex-1;
  }

  :global(#content h3) {
    @apply mb-4 scroll-mt-32 border-b border-neutral-700 pb-3 text-xl font-semibold text-neutral-200;
  }

  :global(#content h5) {
    @apply mt-6 mb-2 text-lg font-medium text-neutral-300;
  }

  :global(#content code) {
    @apply rounded-md bg-neutral-800/50 px-2 py-1 font-mono text-sm text-neutral-300;
  }

  :global(#content code.alt) {
    @apply block rounded-lg bg-neutral-800/50 px-4 py-3 text-sm;
  }

  :global(#content p),
  :global(#content li) {
    @apply py-0.5 text-base! leading-relaxed! text-neutral-400 md:text-base! md:leading-relaxed!;
  }

  :global(#content p) {
    @apply mb-4 last:mb-0;
  }

  :global(#content ul) {
    @apply mb-4 ml-6 list-disc;
  }

  :global(#content b),
  :global(#content strong) {
    @apply font-semibold text-neutral-300;
  }

  :global(#content .string) {
    @apply text-green-600;
  }

  :global(#content .integer) {
    @apply text-yellow-600;
  }

  :global(#content .array) {
    @apply text-blue-600;
  }

  :global(#content .object) {
    @apply text-red-600;
  }

  :global(#content .boolean) {
    @apply text-pink-600;
  }

  :global(#content .optional) {
    @apply font-semibold italic;
  }

  :global(#content .hint-container) {
    @apply my-6 flex items-start gap-3;
  }

  :global(#content .hint) {
    @apply border-primary-700 h-8 border-l-4 pl-4;
  }
</style>
