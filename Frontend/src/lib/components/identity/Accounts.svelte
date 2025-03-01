<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon} from '$icon';
  import type {FullIdentity} from '$type';
  import {ActionIcon} from '$component';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';
  import {group} from '$image';

  let {identity}: {identity: FullIdentity} = $props();
  let accounts = $state();

  onMount(async () => (accounts = await fetchAPI('/api/account/' + identity.id)));
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Online Accounts</h2>
  <div>
    <ActionIcon icon={UserAddIcon} action={() => {}} title="Add Accounts" />
    <ActionIcon icon={UserEditIcon} action={() => {}} title="Change Accounts" />
    <ActionIcon icon={UserDeleteIcon} action={() => {}} title="Delete Accounts" />
  </div>
</section>
{#if accounts?.accounts}
  <section>
    <li>Add Accounts</li>
    <li>Change Accounts</li>
    <li>Delete Accounts</li>
  </section>
{:else}
  <section id="no-accounts" style="background-image: url({group});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Accounts</h2>
    <p class="w-1/2 text-center">
      Keep track of your online accounts linked to this identity using entries. You can store/generate your passwords, usernames, and
      set up TOTP all in one spot
    </p>
    <button>Add Account</button>
  </section>
{/if}

<style lang="postcss">
  #no-accounts {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
