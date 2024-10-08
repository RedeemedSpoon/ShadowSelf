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
