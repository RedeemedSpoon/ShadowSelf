<script lang="ts">
  import Creation from '$component/console/Creation.svelte';
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();
</script>

{#key data.id}<Creation {data} />{/key}
