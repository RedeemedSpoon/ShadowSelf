<script lang="ts">
  import IdentityPage from '../../identity/[slug]/+page.svelte';
  import {PURCHASE_REVIEW_IDENTITY} from '$lib/constants/purchase-review';

  const data = {
    user: '',
    identities: [],
    identitiesError: '',
    slug: PURCHASE_REVIEW_IDENTITY.id,
    identity: PURCHASE_REVIEW_IDENTITY,
    loadError: '',
    status: 200,
  };
</script>

<IdentityPage {data} form={null} params={{slug: PURCHASE_REVIEW_IDENTITY.id}} />
