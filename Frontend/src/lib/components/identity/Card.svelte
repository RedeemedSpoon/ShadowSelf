<script lang="ts">
  import {TransferIcon, RepeatIcon, AddFundsIcon, RetrieveFundsIcon} from '$icon';
  import type {WebSocketResponse, IdentityComponentParams} from '$type';
  import {ActionIcon} from '$component';
  import {identity} from '$store';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';
  import {cart} from '$image';

  let {ws, token}: IdentityComponentParams = $props();
  let purchases = $state();

  onMount(async () => (purchases = await fetchAPI('/api/card/' + $identity.id, token)));
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Virtual Card</h1>
  <div class="flex gap-1">
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={TransferIcon} action={() => {}} title="Transfer Funds" />
    <ActionIcon icon={RetrieveFundsIcon} action={() => {}} title="Retrieve Funds" />
    <ActionIcon icon={AddFundsIcon} action={() => {}} title="Add Funds" />
  </div>
</section>
<section id="no-purchases" style="background-image: url({cart});">
  <h2 class="mt-12 text-5xl text-neutral-300">No Purchases</h2>
  <p class="w-1/2 text-center">
    No money has been transferred to this card and no spending has been made yet. Send some funds over and start using it right away!
  </p>
  <button>Add Funds</button>
</section>

<style lang="postcss">
  #no-purchases {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
