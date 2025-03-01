<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import type {FullIdentity} from '$type';
  import {ActionIcon} from '$component';
  import {onMount} from 'svelte';
  import {token} from '$store';

  let {identity}: {identity: FullIdentity} = $props();

  onMount(async () => {
    const response = await fetch('/api/email/' + identity.id, {
      headers: {'Content-Type': 'application/json', authorization: `Bearer ${$token}`},
    });

    const data = await response.json();
    console.log(data);
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
