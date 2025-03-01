<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon} from '$icon';
  import type {FullIdentity} from '$type';
  import {ActionIcon} from '$component';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {identity}: {identity: FullIdentity} = $props();

  onMount(async () => {
    const response = await fetchAPI('/api/account/' + identity.id);
    console.log(response);
  });
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Online Accounts</h2>
  <div>
    <ActionIcon icon={UserAddIcon} action={() => {}} title="Add Accounts" />
    <ActionIcon icon={UserEditIcon} action={() => {}} title="Change Accounts" />
    <ActionIcon icon={UserDeleteIcon} action={() => {}} title="Delete Accounts" />
  </div>
</section>
<section>
  <li>Add Accounts</li>
  <li>Change Accounts</li>
  <li>Delete Accounts</li>
</section>
