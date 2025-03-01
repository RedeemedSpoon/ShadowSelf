<script lang="ts">
  import {TransferIcon, RepeatIcon, AddFundsIcon, RetrieveFundsIcon} from '$icon';
  import type {FullIdentity} from '$type';
  import {ActionIcon} from '$component';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {identity}: {identity: FullIdentity} = $props();

  onMount(async () => {
    const response = await fetchAPI('/api/card/' + identity.id);
    console.log(response);
  });
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Virtual Card</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={TransferIcon} action={() => {}} title="Transfer Funds" />
    <ActionIcon icon={RetrieveFundsIcon} action={() => {}} title="Retrieve Funds" />
    <ActionIcon icon={AddFundsIcon} action={() => {}} title="Add Funds" />
  </div>
</section>
<section>
  <li>Refresh</li>
  <li>Add Funds</li>
  <li>Retrieve Funds</li>
  <li>Transfer Funds</li>
</section>
