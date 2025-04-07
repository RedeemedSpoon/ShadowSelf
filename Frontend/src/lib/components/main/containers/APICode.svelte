<script lang="ts">
  import {CurlIcon, GoIcon, JavascriptIcon, PythonIcon, RustIcon} from '$icon';
  import type {APIResponse, Languages, Route} from '$type';
  import {HTTPMethod, SelectMenu} from '$component';

  interface Props {
    response?: APIResponse;
    route?: Route;
    hljs?: any;
  }

  let {response, route, hljs}: Props = $props();

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
    setTimeout(() => hljs.highlightElement(document.getElementById(id)), 1);
  };
</script>

<div class="flex items-center justify-between rounded-t-xl bg-neutral-700 px-6 py-3">
  {#if response}
    <h5>Response</h5>
  {:else}
    <h5><HTTPMethod method={route?.method} alt={true} />{route?.url}</h5>
    <SelectMenu {callback} {options} {fullIcons} size="small" name="lang" />
  {/if}
</div>
<div class="mb-8">
  {#if response}
    <pre class="language-json"><code>{JSON.stringify(response, null, 2)}</code></pre>
  {:else}
    {#key lang}
      <pre {id} class="language-{lang}"><code>{route?.code[lang]}</code></pre>
    {/key}
  {/if}
</div>

<style lang="postcss">
  h5 {
    @apply font-sans text-lg font-semibold text-neutral-300;
  }

  pre {
    @apply !rounded-t-none;
  }
</style>
