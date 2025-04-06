<script lang="ts">
  import {HTTPMethod} from '$component';
  import type {APIResponse, Languages, Route} from '$type';

  interface Props {
    response?: APIResponse;
    route?: Route;
  }

  let {response, route}: Props = $props();

  let lang = $state('curl') as Languages;
</script>

<div class="rounded-t-xl bg-neutral-700 p-4">
  {#if response}
    <h5>Response</h5>
  {:else}
    <h5><HTTPMethod method={route?.method} alt={true} />{route?.url}</h5>
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
