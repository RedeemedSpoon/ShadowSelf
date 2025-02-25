<script lang="ts">
  import {Header, Footer, Notification} from '$component';
  import {selectionMenuOpen, user} from '$store';
  import {onMount, type Snippet} from 'svelte';
  import type {LayoutData} from './$types';
  import '../app.css';

  interface Props {
    children: Snippet;
    data: LayoutData;
  }

  let {data, children}: Props = $props();
  $effect(() => user.set(data.user));

  onMount(() => {
    document.querySelector('#app')?.classList.remove('hidden');
    document.addEventListener('touchstart', (e) => e.preventDefault(), {passive: true});
    window.addEventListener('load', () => window.scrollTo(0, 0));
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
    @apply invisible fixed inset-0 z-40 h-screen w-screen;
    @apply bg-black opacity-0 transition-all duration-300 ease-in-out;
  }
</style>
