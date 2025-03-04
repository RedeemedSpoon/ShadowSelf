<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon, LockEditIcon, LockRemoveIcon} from '$icon';
  import {ActionIcon, Modal, LoadingButton} from '$component';
  import {fetching, identity, showModal} from '$store';
  import {group, lock} from '$image';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {ws}: {ws: WebSocket} = $props();
  let inputPassword = $state();
  let accounts = $state();

  onMount(async () => (accounts = await fetchAPI('/api/account/' + $identity.id)));

  async function setMasterPassword() {
    $fetching = 1;
    await new Promise((resolve) => setTimeout(resolve, 750));
    $showModal = 0;
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Online Accounts</h2>
  <div>
    <div class:hidden={!accounts?.password}>
      <ActionIcon icon={LockEditIcon} action={() => {}} title="Edit Master Password" />
      <ActionIcon icon={LockRemoveIcon} action={() => {}} title="Remove Master Password" />
    </div>
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
{:else if !accounts?.password}
  <section id="no-accounts" style="background-image: url({lock});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Master Password</h2>
    <p class="w-1/2 text-center">
      Set a master password to be stored on this device. This ensures only you can access your accounts—no one else, not even us. You
      can change it anytime.
    </p>
    <button onclick={() => ($showModal = 1)}>Add Password</button>
  </section>
  <Modal id={1}>
    <div class="flex flex-col gap-4">
      <h3 class="mt-4 !text-3xl text-neutral-300">Master Password</h3>
      <p class="w-1/2 text-center">
        Set a master password to be stored on this device. This ensures only you can access your accounts—no one else, not even us. You
        can change it anytime.
      </p>
      <input type="password" placeholder="Password" bind:value={inputPassword} />
      <LoadingButton onclick={setMasterPassword}>Set Password</LoadingButton>
    </div>
  </Modal>
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
