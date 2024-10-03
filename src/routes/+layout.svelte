<script lang="ts">
  import '../app.css';
  import {Header, Footer, Notification} from '$components';
  import type {LayoutData} from './$types';
  import {setContext} from 'svelte';
  import {auth} from '$store';

  export let data: LayoutData;

  $auth = data.authenticated;
  setContext('auth', auth);
</script>

<Header />
<main>
  <slot />
</main>
<Footer />
<Notification />

<style lang="postcss">
  main {
    @apply mx-auto my-16 flex max-w-screen-xl flex-col items-center gap-4;
  }
</style>
