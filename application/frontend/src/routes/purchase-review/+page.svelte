<script lang="ts">
  import PurchaseReviewFlow from '$component/purchase/PurchaseReviewFlow.svelte';
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();
</script>

<svelte:head><title>New identity | ShadowSelf</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

{#key data.reviewCase.id + data.plan + data.coin}
  <PurchaseReviewFlow configuration={data.reviewCase} initialPlan={data.plan} initialCoin={data.coin} />
{/key}
