<script lang="ts">
  import '../app.css';
  import {Header, Footer, Notification} from '$components';
  import type {LayoutData} from './$types';
  import {authenticated} from '$store';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  export let data: LayoutData;
  $authenticated = data.authenticated;

  // Temporary, will be removed after official release
  onMount(() => {
    const links = document.querySelectorAll('a');

    links.forEach((link) => {
      if (link.getAttribute('href') === '/') return;
      if (link.getAttribute('href') === 'https://github.com/RedeemedSpoon/ShadowSelf') return;
      if (link.getAttribute('href') === '#product') return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        notify('Website Still Under Development', 'info');
      });
    });
  });
</script>

<Header />
<main>
  <slot />
</main>
<Footer />
<Notification />
