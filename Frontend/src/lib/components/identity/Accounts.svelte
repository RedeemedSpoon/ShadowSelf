<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon, LockEditIcon, LockRemoveIcon, KeyIcon, KeylockIcon} from '$icon';
  import {ActionIcon, Modal, LoadingButton, InputWithIcon, ConfirmModal, SelectMenu} from '$component';
  import {fetching, identity, showModal, showPassword, handleResponse} from '$store';
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {UserIcon, WWWIcon, RepeatIcon, EyeIcon} from '$icon';
  import {fetchAPI, notify} from '$lib';
  import {group, lock} from '$image';
  import {onMount} from 'svelte';

  let {ws, token}: IdentityComponentParams = $props();

  let password = $state(localStorage.getItem('privateKey'));
  let mode = $state('view') as 'view' | 'add' | 'edit';
  let accounts = $state() as FetchAPI;

  const className = {
    label: '!bg-neutral-900/50 !border-neutral-700',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 !bg-neutral-900/50 !border-neutral-700',
    wrapper: 'w-2/3',
  };

  onMount(async () => (accounts = await fetchAPI('/api/account/' + $identity.id, token)));

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'add-account':
        break;

      case 'edit-account':
        break;

      case 'remove-account':
        break;
    }
  };

  async function getMasterKey() {
    const keyBuffer = new Uint8Array(
      atob(password!)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );

    return await crypto.subtle.importKey('raw', keyBuffer, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);
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

  async function removeMasterPassword() {
    localStorage.removeItem('privateKey');
    password = null;
    $showModal = 0;
  }

  async function generatePassword() {
    const password = window.crypto.getRandomValues(new BigUint64Array(1))[0].toString(36);
    const element = document.querySelector('input[name="password"]') as HTMLInputElement;
    element.value = password;
  }

  async function encrypt(unencryptedPassword: string) {
    const key = await getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encodedPassword = new TextEncoder().encode(unencryptedPassword);
    const encryptedBuffer = await crypto.subtle.encrypt({name: 'AES-GCM', iv: iv}, key, encodedPassword);

    const encryptedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    encryptedData.set(iv);
    encryptedData.set(new Uint8Array(encryptedBuffer), iv.length);

    //@ts-expect-error Type 'Uint8Array' is not assignable to type 'string'.
    return btoa(String.fromCharCode.apply(null, encryptedData));
  }

  async function decrypt(encryptedPassword: string) {
    const key = await getMasterKey();

    const encryptedData = new Uint8Array(
      atob(encryptedPassword)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );

    const iv = encryptedData.slice(0, 12);
    const encryptedPasswordBuffer = encryptedData.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt({name: 'AES-GCM', iv: iv}, key, encryptedPasswordBuffer);
    return new TextDecoder().decode(decryptedBuffer);
  }

  async function decryptAll(encryptedAccounts: FetchAPI) {
    return await Promise.all(
      encryptedAccounts.accounts.map(async (account) => ({
        ...account,
        password: await decrypt(account.password),
        totp: account.totp ? await decrypt(account.totp) : null,
      })),
    );
  }

  async function addAccount() {
    $fetching = 1;
    await new Promise((resolve) => setTimeout(resolve, 650));

    const username = (document.querySelector('input[name="username"]') as HTMLInputElement)?.value;
    const rawPassword = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
    const website = (document.querySelector('input[name="website"]') as HTMLInputElement)?.value;
    const rawTotp = (document.querySelector('input[name="totp"]') as HTMLInputElement)?.value;
    const algorithm = (document.querySelector('input[name="algorithm"]') as HTMLSelectElement)?.value.toUpperCase();

    if (!username || !rawPassword) {
      notify('Username and Password are required', 'alert');
      $fetching = 0;
    }

    const password = await encrypt(rawPassword);
    const totp = rawTotp ? await encrypt(rawTotp) : null;

    ws.send(JSON.stringify({type: 'add-account', username, password, website, totp, algorithm}));
  }

  async function editAccount() {}
  async function deleteAccount() {}
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Online Accounts</h2>
  <div class="flex gap-1">
    <div class="flex gap-1" class:hidden={!password}>
      <ActionIcon icon={LockEditIcon} action={() => ($showModal = 2)} title="Edit Master Password" />
      <ActionIcon icon={LockRemoveIcon} action={() => ($showModal = 3)} title="Remove Master Password" />
    </div>
    <ActionIcon icon={UserAddIcon} action={() => (mode = 'add')} title="Add Accounts" />
    <ActionIcon icon={UserEditIcon} action={() => {}} title="Change Accounts" />
    <ActionIcon icon={UserDeleteIcon} action={() => {}} title="Delete Accounts" />
  </div>
</section>
{#if mode === 'add'}
  <section class="flex flex-col items-center gap-8 p-8">
    <h3 class="!text-5xl text-neutral-300">Add Account</h3>
    <div class="flex gap-8">
      <div class="flex flex-col gap-2">
        <label for="username">Username<span class="text-red-600">*</span></label>
        <InputWithIcon type="text" name="username" placeholder="Username" icon={UserIcon} />
        <div class="flex justify-between gap-4">
          <label for="password">Password<span class="text-red-600">*</span></label>
          <div class="mt-2">
            <ActionIcon title="regenerate a random password" icon={RepeatIcon} action={generatePassword} size="small" />
            <ActionIcon title="show password" icon={EyeIcon} action={() => ($showPassword = !$showPassword)} size="small" />
          </div>
        </div>
        <InputWithIcon type={$showPassword ? 'text' : 'password'} name="password" placeholder="Password" icon={KeyIcon} />
        <label for="website">Website</label>
        <InputWithIcon type="url" name="website" placeholder="Website URL" icon={WWWIcon} />
      </div>
      <div class="flex flex-col gap-2">
        <label for="totp">Totp Secret</label>
        <InputWithIcon type="text" name="totp" placeholder="Totp Secret" icon={KeylockIcon} />
        <label for="algorithm">Algorithm</label>
        <SelectMenu options={['SHA1', 'SHA256', 'SHA512']} name="algorithm" />
        <p>* Required Fields</p>
      </div>
    </div>
    <LoadingButton onclick={addAccount}>Add Account</LoadingButton>
  </section>
{:else if mode === 'edit'}
  <section></section>
{:else if accounts?.accounts.length}
  <section>
    {#await decryptAll(accounts) then decryptedAccounts}
      {#each decryptedAccounts as account}
        <p>{account.username} {account.password}</p>
      {/each}
    {/await}
  </section>
{:else if !password}
  <section id="no-accounts" style="background-image: url({lock});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Master Password</h2>
    <p class="w-1/2 text-center">
      Set/recover a master password that will be stored on this device. This ensures only you can access your accounts—no one else, not
      even us. You can change it anytime.
    </p>
    <button onclick={() => ($showModal = 1)}>Add Password</button>
  </section>
  <Modal id={1}>
    <div class="flex flex-col items-center gap-8 p-8">
      <h3 class="w-full !text-5xl text-neutral-300">Setup Master Password</h3>
      <p class="w-[40vw]">
        Set/recover a master password to secure your accounts, ensuring only you can access them. You can update it anytime for added
        security.
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
    <button onclick={() => (mode = 'add')}>Add Account</button>
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

  label {
    @apply ml-2 mt-2 text-neutral-300;
  }
</style>
