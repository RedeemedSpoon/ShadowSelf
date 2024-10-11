<script lang="ts">
  import '../app.css';
  import {Header, Footer, Notification} from '$components';
  import type {LayoutData} from './$types';
  import {authenticated} from '$store';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  export let data: LayoutData;
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
    <slot />
  </main>
  <Footer />
  <Notification />
</div>
<noscript class="mx-auto my-32 flex flex-col gap-8 text-center">
  <h1>It looks like you <br />disabled JavaScript!</h1>
  <p>That's totally normal! Please visit this page on our <a href="/">dark web</a> site instead.</p>
  <p class="text-xs">It's coming soon! we promise.</p>
</noscript>
