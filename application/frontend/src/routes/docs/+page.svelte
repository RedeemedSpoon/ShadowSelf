<script lang="ts">
  import 'highlight.js/styles/tokyo-night-dark.css';
  import {APICode, HTTPMethod} from '$component';
  import type {PageData} from './$types';
  import {formatCasing} from '$format';
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

  const scrollTo = (hash: string) => {
    if (hash) window.location.hash = hash;
    anchor = hash;
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
  <ol class="max-h-[calc(100vh-12.5rem)] max-2xl:hidden!">
    {#each data.docs.sections as section (section.title)}
      {@const Icon = section.icon}
      <ul class="mt-4">
        <li class="title mb-2 flex items-center gap-2 text-3xl! text-neutral-300!">
          <Icon className="h-8 w-8 cursor-default stroke-neutral-300!" fill={false} />
          {formatCasing(section.title)}
        </li>
        {#each section.more as subsection (subsection.title)}
          {@const hash = subsection.title.replace(/\s/g, '-')}
          <li aria-hidden="true" onclick={() => scrollTo(hash)} class="{anchor === hash && 'anchor'} my-2 flex items-center gap-2">
            <HTTPMethod method={subsection.method} />
            {formatCasing(subsection.title)}
          </li>
        {/each}
      </ul>
    {/each}
  </ol>
  <span class="mr-[1.5vw] w-0.5 self-stretch bg-neutral-700 max-2xl:hidden!"></span>
  <section id="content" class="flex flex-col gap-8 self-stretch xl:w-3/4 xl:max-2xl:mx-auto">
    <h1 class="basic-style text-4xl font-bold md:text-6xl">API Documentation</h1>
    {#each data.docs.content as content, i (content.title)}
      {@const Icon = content.icon}
      <h2 class="flex items-center gap-2 text-4xl text-neutral-300 md:text-5xl">
        <Icon className="h-10 md:h-14 w-10 md:w-14 stroke-neutral-300! cursor-default" fill={false} />
        {formatCasing(content.title)}
      </h2>
      <div class="flex flex-col gap-4 max-lg:max-w-[calc(100vw-2rem)]">
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

        {#if content.routes}
          {#each content.routes as route (route.title)}
            {@const RouteDescription = route.description}
            <div class="-mt-5 flex gap-8 max-xl:flex-col max-lg:max-w-screen md:p-4">
              <section class="2xl:w-1/2">
                <h3 class="mb-6" id={route.title.replace(/\s/g, '-')}>
                  {formatCasing(route.title)}:
                </h3>
                <RouteDescription />
              </section>
              <section class="mt-6 2xl:w-1/2">
                <APICode {hljs} {route} />
                <APICode {hljs} response={route.response} />
              </section>
            </div>
          {/each}
        {/if}
      </div>
      {#if i !== data.docs.content.length - 1}
        <hr class="bg-neutral-700" />
      {/if}
    {/each}
  </section>
</div>

<style lang="postcss">
  @reference "$style";

  #docs {
    @apply mx-auto my-[12.5rem] flex text-neutral-400 max-xl:px-[2vw] max-md:px-4 2xl:w-8/9;
  }

  ol {
    @apply no-scrollbar sticky top-36 flex shrink-0 flex-col self-start overflow-y-auto pr-[1vw];
  }

  li {
    @apply text-xl text-neutral-400 md:text-nowrap;
  }

  ol li:not(.title) {
    @apply ml-10 w-fit cursor-pointer px-4 py-1 transition-all duration-300 ease-in-out select-none;
    @apply rounded-full hover:bg-neutral-300/10;
  }

  .anchor {
    @apply bg-neutral-300/15 hover:!bg-neutral-300/15;
  }

  :global(#content h3) {
    @apply border-primary-700 mt-6 w-fit scroll-mt-[12.5rem] border-b-2 pb-4 text-4xl text-neutral-300;
  }

  :global(#content h5) {
    @apply mb-3 pt-6 text-2xl text-neutral-300;
  }

  :global(#content code) {
    @apply rounded-xl bg-neutral-800 px-2 font-mono text-lg;
  }

  :global(#content code.alt) {
    @apply px-4 py-3 text-lg text-neutral-300;
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

  :global(#content .optional) {
    @apply font-semibold italic;
  }

  :global(#content .hint-container) {
    @apply ml-10 flex items-center gap-3;
  }

  :global(#content .hint) {
    @apply border-primary-700 my-2 border-l-4 pl-4;
  }

  :global(#content pre) {
    @apply w-full rounded-xl bg-neutral-800 p-4;
  }

  :global(#content ul) {
    @apply ml-4 list-disc md:ml-10;
  }

  :global(#content p) {
    @apply leading-relaxed;
  }

  :global(#content b) {
    @apply text-neutral-300;
  }
</style>
