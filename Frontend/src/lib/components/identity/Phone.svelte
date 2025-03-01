<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import type {FullIdentity} from '$type';
  import {ActionIcon} from '$component';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {identity}: {identity: FullIdentity} = $props();

  onMount(async () => {
    const response = await fetchAPI('/api/phone/' + identity.id);
    console.log(response);
  });
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Phone Number</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send SMS" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete SMS" />
  </div>
</section>
<section>
  <li>Refresh</li>
  <li>Send SMS</li>
  <li>Delete SMS</li>
</section>
