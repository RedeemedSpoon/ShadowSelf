<script lang="ts">
  import Notifications from '$component/ui/Notifications.svelte';
  import AuthBackground from '$component/ui/AuthBackground.svelte';
  import {APP_ORIGIN} from '$constant';
  import {page} from '$app/state';
  import {goto, onNavigate} from '$app/navigation';
  import {MediaQuery} from 'svelte/reactivity';
  import type {Snippet} from 'svelte';
  import type {LayoutData} from './$types';
  import PublicHeader from '$component/public/PublicHeader.svelte';
  import PublicFooter from '$component/public/PublicFooter.svelte';
  import ConsoleShell from '$component/console/ConsoleShell.svelte';
  import '@fontsource-variable/fira-code';
  import '@fontsource-variable/inter';
  import '../app.css';

  let {data, children}: {data: LayoutData; children: Snippet} = $props();
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

  onNavigate((navigation) => {
    const authNavigation = [navigation.from?.url.pathname, navigation.to?.url.pathname].some(
      (path) => path === '/login' || path === '/signup',
    );

    if (
      authNavigation ||
      reducedMotion.current ||
      !document.startViewTransition ||
      navigation.from?.url.pathname === navigation.to?.url.pathname
    ) {
      return;
    }

    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  async function followSection(event: MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;

    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) {
      return;
    }

    const destination = new URL(link.href);

    if (
      destination.origin !== location.origin ||
      destination.pathname !== location.pathname ||
      destination.search !== location.search ||
      !destination.hash
    ) {
      return;
    }

    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));

    if (!target) {
      return;
    }

    event.preventDefault();
    await goto(destination, {noScroll: true, keepFocus: true});

    if (link.classList.contains('skip-link')) {
      target.tabIndex = -1;
      target.focus({preventScroll: true});
    }

    target.scrollIntoView({behavior: reducedMotion.current ? 'instant' : 'smooth', block: 'start'});
  }
  const accessRoute = $derived(['/login', '/signup'].includes(page.url.pathname));

  const consoleRoute = $derived(
    ['/dashboard', '/settings', '/identity', '/purchase', '/create'].some(
      (route) => page.url.pathname === route || page.url.pathname.startsWith(`${route}/`),
    ),
  );
</script>

<svelte:head><meta property="og:url" content={APP_ORIGIN} /></svelte:head>

<svelte:document onclickcapture={followSection} />

<a class="skip-link" href="#main-content">Skip to content</a>
{#if consoleRoute}<ConsoleShell user={data.user} identities={data.identities} identitiesError={data.identitiesError}
    >{@render children()}</ConsoleShell
  >{:else}<div class="public-site">
    <PublicHeader signedIn={Boolean(data.user)} />
    <main id="main-content" class="public-main" class:auth-page={accessRoute}>
      {#if accessRoute}<AuthBackground />{/if}
      {@render children()}
    </main>
    <PublicFooter />
  </div>{/if}

<Notifications />
