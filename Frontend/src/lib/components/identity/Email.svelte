<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import type {FullIdentity} from '$type';
  import {ActionIcon} from '$component';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {identity}: {identity: FullIdentity} = $props();

  onMount(async () => {
    const response = await fetchAPI('/api/email/' + identity.id);
    console.log(response);
  });
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Email Address</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send Emails" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete Emails" />
  </div>
</section>
<section>
  <li>Refresh</li>
  <li>Send Emails</li>
  <li>Delete Emails</li>
</section>
