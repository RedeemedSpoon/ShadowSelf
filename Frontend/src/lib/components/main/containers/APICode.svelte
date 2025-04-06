<script lang="ts">
  import {CurlIcon, GoIcon, JavascriptIcon, PythonIcon, RustIcon} from '$icon';
  import type {APIResponse, Languages, Route} from '$type';
  import {HTTPMethod, SelectMenu} from '$component';

  interface Props {
    response?: APIResponse;
    route?: Route;
  }

  let {response, route}: Props = $props();

  const options = ['cURL', 'Python', 'Javascript', 'Rust', 'Go'];
  const fullIcons = {
    curl: CurlIcon,
    python: PythonIcon,
    javascript: JavascriptIcon,
    rust: RustIcon,
    go: GoIcon,
  };

  let lang = $state('curl') as Languages;
  const callback = (value: string) => {
    lang = value as Languages;
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
    <pre class="language-{lang}"><code>{route?.code[lang]}</code></pre>
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
