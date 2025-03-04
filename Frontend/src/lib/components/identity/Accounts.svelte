<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon, LockEditIcon, LockRemoveIcon, KeyIcon} from '$icon';
  import {ActionIcon, Modal, LoadingButton, InputWithIcon, ConfirmModal} from '$component';
  import {fetching, identity, showModal} from '$store';
  import {group, lock} from '$image';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {ws}: {ws: WebSocket} = $props();

  let password = $state(localStorage.getItem('privateKey'));
  let accounts = $state();

  const className = {
    label: '!bg-neutral-900/50 !border-neutral-700',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 !bg-neutral-900/50 !border-neutral-700',
    wrapper: 'w-2/3',
  };

  onMount(async () => (accounts = await fetchAPI('/api/account/' + $identity.id)));

  async function encryptPassword(password: string) {}
  async function decryptPassword(password: string) {}

  async function removeMasterPassword() {
    localStorage.removeItem('privateKey');
    password = null;
    $showModal = 0;
  }

  async function setMasterPassword() {
    $fetching = 1;
    await new Promise((resolve) => setTimeout(resolve, 750));

    const inputElement = document.querySelector('input[name="password"]') as HTMLInputElement;
    const input = new TextEncoder().encode(inputElement.value || 'test');
    const keyMaterial = await crypto.subtle.importKey('raw', input, {name: 'PBKDF2'}, false, ['deriveKey']);

    const algorithm = {name: 'PBKDF2', salt: new Uint8Array(0), iterations: 100000, hash: 'SHA-256'};
    const key = await crypto.subtle.deriveKey(algorithm, keyMaterial, {name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);

    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    const base64Key = btoa(String.fromCharCode.apply(null, new Uint8Array(keyBuffer) as unknown as number[]));
    localStorage.setItem('privateKey', base64Key);

    password = base64Key;
    $fetching = 0;
    $showModal = 0;
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Online Accounts</h2>
  <div>
    <div class:hidden={!password}>
      <ActionIcon icon={LockEditIcon} action={() => ($showModal = 2)} title="Edit Master Password" />
      <ActionIcon icon={LockRemoveIcon} action={() => ($showModal = 3)} title="Remove Master Password" />
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
{:else if !password}
  <section id="no-accounts" style="background-image: url({lock});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Master Password</h2>
    <p class="w-1/2 text-center">
      Set a master password to be stored on this device. This ensures only you can access your accounts—no one else, not even us. You
      can change it anytime.
    </p>
    <button onclick={() => ($showModal = 1)}>Add Password</button>
  </section>
  <Modal id={1}>
    <div class="flex flex-col items-center gap-8 p-8">
      <h3 class="w-full !text-5xl text-neutral-300">Setup Master Password</h3>
      <p class="w-[40vw]">
        Set a master password to secure your accounts, ensuring only you can access them. You can update it anytime for added security.
      </p>
      <InputWithIcon {className} icon={KeyIcon} type="password" placeholder="Password" name="password" />
      <LoadingButton className="w-2/3" onclick={setMasterPassword}>Set Password</LoadingButton>
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
  <Modal id={2}>
    <div class="flex flex-col items-center gap-8 p-8">
      <h3 class="w-full !text-5xl text-neutral-300">Change Master Password</h3>
      <p class="w-[40vw]">
        Change the master password of your accounts and automatically update all of your accounts. There is no going back once you set
        it.
      </p>
      <InputWithIcon {className} icon={KeyIcon} type="password" placeholder="Password" name="password" />
      <LoadingButton className="w-2/3" onclick={setMasterPassword}>Change Password</LoadingButton>
    </div>
  </Modal>
  <ConfirmModal id={3} onclick={removeMasterPassword} text="Removing the local master password" />
{/if}

<style lang="postcss">
  #no-accounts {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
