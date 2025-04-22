<script lang="ts">
  import {CurlIcon, GoIcon, JavascriptIcon, PythonIcon, RustIcon} from '$icon';
  import type {APIResponse, Languages, Route} from '$type';
  import {HTTPMethod, SelectMenu} from '$component';

  interface Props {
    response?: APIResponse;
    websocket?: unknown;
    hljs?: unknown;
    route?: Route;
  }

  let {websocket, response, route, hljs}: Props = $props();

  let lang = $state('curl') as Languages;
  const id = Math.random().toString(36).slice(2);
  const options = ['cURL', 'Python', 'Javascript', 'Rust', 'Go'];

  const fullIcons = {
    curl: CurlIcon,
    python: PythonIcon,
    javascript: JavascriptIcon,
    rust: RustIcon,
    go: GoIcon,
  };

  const callback = (value: string) => {
    lang = value as Languages;
    // @ts-expect-error Unknown object
    setTimeout(() => hljs.highlightElement(document.getElementById(id)), 1);
  };
</script>

<div class="head px-6 py-3">
  {#if response}
    <h6>Response</h6>
  {:else if websocket}
    <h6>Websocket</h6>
    <SelectMenu {callback} {options} {fullIcons} size="small" name="lang" />
  {:else}
    <h6><HTTPMethod method={route?.method} alt={true} />{route?.url}</h6>
    <SelectMenu {callback} {options} {fullIcons} size="small" name="lang" />
  {/if}
</div>

<div class="mb-8">
  {#if response}
    <pre class="language-json"><code class="text-base!">{JSON.stringify(response, null, 2)}</code></pre>
  {:else}
    {#key lang}
      {@const code = route?.code[lang] || (websocket as {[key in Languages]: string})[lang]}
      <pre {id} class="language-{lang}"><code class="text-base!">{code}</code></pre>
    {/key}
  {/if}
</div>

<style lang="postcss">
  @reference "tailwindcss";

  .head {
    @apply flex w-full max-w-[calc(100vw-4rem)] items-center justify-between rounded-t-xl bg-neutral-700 xl:max-w-[calc(50vw-10rem)];
  }

  h6 {
    @apply font-sans text-lg font-semibold text-neutral-300;
  }

  pre {
    @apply w-full max-w-[calc(100vw-4rem)] overflow-x-scroll !rounded-t-none xl:max-w-[calc(50vw-10rem)];
  }
</style>
