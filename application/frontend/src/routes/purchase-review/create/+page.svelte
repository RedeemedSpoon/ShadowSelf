<script lang="ts">
  import Creation from '$component/console/Creation.svelte';
  import type {CreationData} from '$type';

  const data: CreationData = {
    id: 'preview00001',
    creation: {draft: {}, status: 'inactive', creationStatus: 'editing'},
    loadError: '',
  };
</script>

<svelte:head
  ><title>Create your identity | ShadowSelf</title><meta name="robots" content="noindex,nofollow" /></svelte:head>
<Creation {data} />
