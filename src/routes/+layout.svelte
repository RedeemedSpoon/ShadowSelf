<script lang="ts">
  import '../app.css';
  import {Header, Footer, Notification} from '$components';
  import type {LayoutData} from './$types';
  import {authenticated} from '$store';

  export let data: LayoutData;
  $authenticated = data.authenticated;
</script>

<Header />
<main>
  <slot />
</main>
<Footer />
<Notification />

<style lang="postcss">
  main {
    @apply mx-auto flex max-w-screen-xl flex-col items-center gap-4;
  }
</style>
