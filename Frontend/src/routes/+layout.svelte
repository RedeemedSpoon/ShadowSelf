<script lang="ts">
  import '../app.css';
  import {Header, Footer, Notification} from '$components';
  import {authenticated, selectionMenuOpen} from '$store';
  import {onMount, type Snippet} from 'svelte';
  import {type LayoutData} from './$types';
  import {notify} from '$lib';

  interface Props {
    data: LayoutData;
    children?: Snippet;
  }

  let {data, children}: Props = $props();
  $authenticated = data.authenticated;

  onMount(() => {
    document.querySelector('#app')?.classList.remove('hidden');
    document.addEventListener('touchstart', (e) => e.preventDefault(), {passive: true});

    const links = document.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '/') return;
      if (href === '/privacy-policy') return;
      if (href === '/terms-of-service') return;
      if (href === '/refund-policy') return;
      if (href === '/contact') return;
      if (href === '/about') return;
      if (href === '/faq') return;
      if (href === '#product') return;
      if (href === 'https://github.com/RedeemedSpoon/ShadowSelf') return;
      if (
        href ===
        'https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FBeFzdR4Kf7Q02gL-WYj4ARNuq-4w38La%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEARpdiglYHg8sSwh75mzI5PP8qMG-n8i1kD8_wjHATxzI%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%227l53Rzu4TIgWzfqdJrFRuA%3D%3D%22%7D'
      )
        return;

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
