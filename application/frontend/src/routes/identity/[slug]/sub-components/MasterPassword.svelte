<script lang="ts">
  import {Modal, LoadingButton, InputWithIcon, ConfirmModal} from '$component';
  import {fetchIndex, identity, modalIndex, masterPassword} from '$store';
  import type {Account, APIResponse} from '$type';
  import type {Writable} from 'svelte/store';
  import {encrypt, decrypt} from '$crypto';
  import {fetchAPI} from '$fetch';
  import {KeyIcon} from '$icon';
  import {lock} from '$image';
  import {notify} from '$lib';

  interface Props {
    accounts: Writable<APIResponse>;
    mode: Writable<'view' | 'add' | 'edit'>;
    target: Writable<Account | null>;
  }

  let {accounts, mode, target}: Props = $props();

  const className = {
    label: 'bg-neutral-900/50! border-neutral-700!',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 bg-neutral-900/50! border-neutral-700!',
    wrapper: 'w-2/3',
  };

  async function setMasterPassword() {
    $fetchIndex = 1;
    await new Promise((resolve) => setTimeout(resolve, 750));

    const inputElement = document.querySelector('input[name="master"]') as HTMLInputElement;
    const input = new TextEncoder().encode(inputElement.value || 'test');
    const keyMaterial = await crypto.subtle.importKey('raw', input, {name: 'PBKDF2'}, false, ['deriveKey']);

    const algorithm = {name: 'PBKDF2', salt: new Uint8Array(0), iterations: 100000, hash: 'SHA-256'};
    const key = await crypto.subtle.deriveKey(algorithm, keyMaterial, {name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);

    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    const base64Key = btoa(String.fromCharCode.apply(null, new Uint8Array(keyBuffer) as unknown as number[]));

    if (!$masterPassword) $masterPassword = base64Key;

    const updatedAccounts = await Promise.all(
      $accounts.accounts.map(async (account) => {
        const oldPassword = await decrypt(account.password);
        const oldTotp = account.totp ? await decrypt(account.totp) : 'unable to decrypt';

        if (oldPassword === 'unable to decrypt' && oldTotp === 'unable to decrypt') return account;

        return {
          id: account.id,
          password: await encrypt(oldPassword, key),
          totp: account.totp ? await encrypt(oldTotp, key) : null,
        };
      }),
    );

    $masterPassword = base64Key;
    localStorage.setItem('key-' + $identity.id, base64Key);

    const response = await fetchAPI('account/update-encryption', 'PUT', {accounts: updatedAccounts});
    if (response.err) return notify(response.err, 'alert');

    const responseAccounts = $accounts.accounts.map((account) => {
      const updatedAccount = response.accounts.find((a) => a.id === account.id);
      return {
        ...account,
        password: updatedAccount!.password,
        totp: updatedAccount!.totp || '',
      };
    });

    $accounts.accounts = responseAccounts;
    $mode = 'view';
    $modalIndex = 0;
    $fetchIndex = 0;
    $target = null;
  }

  async function removeMasterPassword() {
    localStorage.removeItem('key-' + $identity.id);
    $masterPassword = '';
    $modalIndex = 0;
  }
</script>

{#if !$masterPassword}
  <section id="no-accounts" style="background-image: url({lock});">
    <h2 class="mt-12 text-center text-5xl text-neutral-300">No Master Password</h2>
    <p class="text-center md:w-1/2">
      Set a Master Password that lives only on this device. We have zero access to your keys. IF YOU FORGET THIS, YOUR ACCOUNTS ARE
      LOST FOREVER.
    </p>
    <button onclick={() => ($modalIndex = 2)}>Add Password</button>
  </section>
{/if}

<Modal id={2}>
  <div class="flex flex-col items-center gap-8 p-4 sm:p-8">
    <h3 class="w-full text-3xl! text-neutral-300 md:text-5xl!">Setup Master Password</h3>
    <p class="md:w-[40vw]">
      Secure your vault with a Master Password only you know. You can update it anytime. WE CANNOT RESET THIS. LOSE IT AND YOU LOSE
      EVERYTHING.
    </p>
    <InputWithIcon {className} icon={KeyIcon} type="password" placeholder="Password" name="master" />
    <LoadingButton className="w-2/3" onclick={setMasterPassword}>Set Password</LoadingButton>
  </div>
</Modal>

<Modal id={3}>
  <div class="flex flex-col items-center gap-8 p-4 sm:p-8">
    <h3 class="w-full text-3xl! text-neutral-300 md:text-5xl!">Change Master Password</h3>
    <p class="md:w-[40vw]">
      Update your Master Password to re-encrypt your entire vault. This action is immediate. MEMORIZE THIS. IF YOU FORGET IT, DATA
      RECOVERY IS IMPOSSIBLE.
    </p>
    <InputWithIcon {className} icon={KeyIcon} type="password" placeholder="Password" name="master" />
    <LoadingButton className="w-2/3" onclick={setMasterPassword}>Change Password</LoadingButton>
  </div>
</Modal>

<ConfirmModal id={4} onclick={removeMasterPassword} text="Removing the local master password" />

<style lang="postcss">
  @reference "$style";

  #no-accounts {
    @apply mt-12 mb-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
