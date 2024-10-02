<script lang="ts">
  import '../app.css';
  import {Header, Footer} from '$lib';

  import {setContext} from 'svelte';
  import {writable} from 'svelte/store';
  import type {LayoutData} from './$types';

  export let data: LayoutData;

  const authenticated = writable(data.authenticated);
  setContext('auth', authenticated);
</script>

<Header />
<main>
  <slot />
</main>
<Footer />

<style lang="postcss">
  main {
    @apply flex flex-col items-center gap-4 bg-neutral-900 text-neutral-300;
  }
</style>
