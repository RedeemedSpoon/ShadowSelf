<script lang="ts">
  import '../app.css';
  import {Header, Footer} from '$lib';

  import {setContext} from 'svelte';
  import {writable} from 'svelte/store';
  import type {LayoutData} from './$types';

  export let data: LayoutData;

  const authenticated = writable<boolean>(data.authenticated);
  setContext('auth', authenticated);
</script>

<Header />
<main>
  <slot />
</main>
<Footer />

<style lang="postcss">
  main {
    @apply mx-auto my-16 flex max-w-screen-xl flex-col items-center gap-4;
  }
</style>
