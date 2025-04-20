<script lang="ts">
  import {Header, Footer, Notification} from '$component';
  import {selectionMenuOpen, token, user} from '$store';
  import {onMount, type Snippet} from 'svelte';
  import type {LayoutData} from './$types';
  import '../app.css';

  interface Props {
    children: Snippet;
    data: LayoutData;
  }

  let {data, children}: Props = $props();

  user.set(data.user);
  token.set(data.token);

  onMount(() => {
    document.querySelector('#app')?.classList.remove('hidden');
    document.addEventListener('touchstart', (e) => e.preventDefault(), {passive: true});
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

<noscript class="flex h-screen w-full flex-col items-center justify-center gap-2 text-center">
  <h1 class="basic-style mb-5 text-4xl font-bold">Whoops! No JavaScript?</h1>
  <p>Our app is pretty dynamic and kinda needs JavaScript to do... well, pretty much anything interactive.</p>
  <p>So yeah, it's not really going to work without it enabled. ¯\_(ツ)_/¯</p>
  <p>Sorry for the hassle! I'm sure you'll get it eventually.</p>
  <p class="mt-4 text-sm text-neutral-500">
    Well, at least you can see how it's all put together! The code is open source over on GitHub:
    <a href="https://github.com/RedeemedSpoon/ShadowSelf" target="_blank" rel="noopener noreferrer">Check it out here!</a>
  </p>
</noscript>

<style lang="postcss">
  #overlay {
    @apply invisible fixed inset-0 z-40 h-screen w-screen;
    @apply bg-black opacity-0 transition-all duration-300 ease-in-out;
  }
</style>
