<script lang="ts">
  import '../app.css';
  import {Header, Footer, Notification} from '$components';
  import {authenticated, selectionMenuOpen} from '$store';
  import {type LayoutData} from './$types';
  import {onMount, type Snippet} from 'svelte';
  import {notify} from '$lib';

  interface Props {
    data: LayoutData;
    children?: Snippet;
  }

  let {data, children}: Props = $props();
  $authenticated = data.authenticated;

  onMount(() => {
    document.querySelector('#app')?.classList.remove('hidden');
    // Temporary, will be removed after official release
    const links = document.querySelectorAll('a');

    links.forEach((link) => {
      if (link.getAttribute('href') === '/') return;
      if (link.getAttribute('href') === 'https://github.com/RedeemedSpoon/ShadowSelf') return;
      if (link.getAttribute('href') === '#product') return;

      link.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        notify("We still didn't launch yet!", 'info');
      });
    });
  });
</script>

<div class="hidden" id="app">
  <Header />
  <main>
    {@render children?.()}
  </main>
  <Footer />
  <Notification />
  <div
    id="overlay"
    aria-hidden="true"
    class={$selectionMenuOpen ? '!visible !opacity-35' : ''}
    onclick={() => ($selectionMenuOpen = false)}>
  </div>
</div>

<noscript class="flex h-screen w-full flex-col items-center justify-center gap-8 text-center">
  <h1>It looks like you <br />disabled JavaScript!</h1>
  <p>That's totally fine. Tho please visit this page on our <a href="/">dark web</a> site instead.</p>
  <p class="text-sm">It's coming soon! we promise.</p>
</noscript>

<style lang="postcss">
  #overlay {
    @apply invisible fixed inset-0 z-40 h-screen w-screen bg-black opacity-0 transition-all duration-300 ease-in-out;
  }
</style>
