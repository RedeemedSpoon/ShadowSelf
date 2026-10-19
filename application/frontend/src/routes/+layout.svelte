<script lang="ts">
  import {page} from '$app/state';
  import type {Snippet} from 'svelte';
  import type {LayoutData} from './$types';
  import PublicHeader from '$component/public/PublicHeader.svelte';
  import PublicFooter from '$component/public/PublicFooter.svelte';
  import ConsoleShell from '$component/console/ConsoleShell.svelte';
  import '@fontsource-variable/fira-code';
  import '@fontsource-variable/inter';
  import '../app.css';

  let {data, children}: {data: LayoutData; children: Snippet} = $props();
  const consoleRoute = $derived(
    ['/dashboard', '/settings', '/identity', '/purchase', '/create'].some(
      (route) => page.url.pathname === route || page.url.pathname.startsWith(`${route}/`),
    ),
  );
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
{#if consoleRoute}<ConsoleShell user={data.user}>{@render children()}</ConsoleShell>{:else}<div class="public-site">
    <PublicHeader signedIn={Boolean(data.user)} />
    <main id="main-content" class="public-main">{@render children()}</main>
    <PublicFooter />
  </div>{/if}
