<script lang="ts">
  import {LockEditIcon, LockRemoveIcon, KeyIcon, KeylockIcon, UserIcon, WWWIcon} from '$icon';
  import {UserAddIcon, UserEditIcon, UserDeleteIcon, QuestionIcon, BackIcon} from '$icon';
  import {fetchIndex, identity, modalIndex, handleResponse, masterPassword} from '$store';
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import MasterPassword from './sub-components/MasterPassword.svelte';
  import {ActionIcon, Tooltip, HoverCopyButton} from '$component';
  import AccountEdit from './sub-components/AccountEdit.svelte';
  import * as OTPAuth from 'otpauth';
  import {decrypt} from '$crypto';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';
  import {group} from '$image';

  let {ws, token}: IdentityComponentParams = $props();

  $masterPassword = localStorage.getItem('key-' + $identity.id) || '';

  let mode = $state('view') as 'view' | 'add' | 'edit';
  let target = $state() as FetchAPI['accounts'][number] | null;
  let accounts = $state() as FetchAPI;

  onMount(async () => {
    accounts = await fetchAPI('/api/account/' + $identity.id, token);
    target = null;
  });

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'add-account':
        // @ts-expect-error nonsense
        accounts.accounts.push(response);
        break;

      case 'edit-account':
        // @ts-expect-error nonsense
        accounts.accounts = [...accounts.accounts.filter((account) => account.id !== (response.id as unknown)), response];
        break;

      case 'remove-account':
        accounts.accounts = accounts.accounts.filter((account) => account.id !== (response.id as unknown));
        break;

      case 'update-encryption': {
        const updatedAccounts = accounts.accounts.map((account) => {
          const updatedAccount = response.accounts!.find((a) => a.id === account.id);
          return {
            ...account,
            password: updatedAccount!.password,
            totp: updatedAccount!.totp || '',
          };
        });

        accounts.accounts = updatedAccounts;
        $modalIndex = 0;
        break;
      }
    }

    if (!response.error) {
      mode = 'view';
      $fetchIndex = 0;
      target = null;
    }
  };

  function handleClick(account: FetchAPI['accounts'][number]) {
    if (target?.id == account.id && account.website) {
      let websiteURL = account.website.startsWith('http') ? account.website : 'https://' + account.website;
      window.open(websiteURL, '_blank');
    }

    target = account;
  }

  async function createTOTPGenerator(secret: string, algorithm: string, id: number) {
    await new Promise((resolve) => setTimeout(resolve, 10));

    const generator = new OTPAuth.TOTP({algorithm, secret});
    const element = document.getElementById(id.toString()) as HTMLParagraphElement;
    element.innerText = generator.generate();

    setInterval(() => (element.innerText = generator.generate()), 30000);
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
  async function changeModeToEdit() {
    mode = 'edit';
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (const input of ['username', 'password', 'website', 'totp', 'algorithm']) {
      const element = document.querySelector('input[name="' + input + '"]') as HTMLInputElement;
      element.value = target![input as keyof FetchAPI['accounts'][number]] as string;
    }
  }

  async function deleteAccount() {
    ws.send(JSON.stringify({type: 'remove-account', id: target!.id}));
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Online Accounts</h1>
  <div class="flex gap-1">
    <div class:hidden={mode === 'view'}>
      <ActionIcon icon={BackIcon} action={() => (mode = 'view')} title="Ignore Changes" />
    </div>
    <div class="flex gap-1" class:hidden={!$masterPassword}>
      <ActionIcon icon={LockEditIcon} action={() => ($modalIndex = 2)} title="Edit Master Password" />
      <ActionIcon icon={LockRemoveIcon} action={() => ($modalIndex = 3)} title="Remove Local Master Password" />
    </div>
    <ActionIcon disabled={!$masterPassword} icon={UserAddIcon} action={() => (mode = 'add')} title="Add Accounts" />
    <ActionIcon disabled={!target} icon={UserEditIcon} action={changeModeToEdit} title="Edit Accounts" />
    <ActionIcon disabled={!target} icon={UserDeleteIcon} action={deleteAccount} title="Delete Accounts" />
  </div>
</section>

{#if mode === 'view' && accounts?.accounts.length && $masterPassword}
  {#key accounts.accounts}
    <section class="min-h-[40vh]">
      {#await decryptAll(accounts) then decryptedAccounts}
        {#each decryptedAccounts as account}
          <div
            aria-hidden="true"
            onclick={() => handleClick(account as FetchAPI['accounts'][number])}
            class="{target && target?.id == account.id ? 'target' : ''} wrapper last:border-b-0">
            <div class="flex w-1/3 flex-col overflow-hidden">
              <HoverCopyButton text={account.username} icon={UserIcon} color="!text-neutral-300" />
              {#if account.website}
                <HoverCopyButton text={account.website} size="small" icon={WWWIcon} color="!text-neutral-500" />
              {/if}
            </div>
            <div class="w-1/3 overflow-hidden">
              {#if account.totp}
                <div class="flex flex-col items-center">
                  <HoverCopyButton id={account.id.toString()} icon={KeylockIcon} color="!text-neutral-400" />
                  <div class="relative mt-2 h-1 w-1/2 rounded-2xl bg-neutral-800">
                    <div class="animate-progress bg-primary-700 absolute left-0 top-0 h-full rounded-2xl"></div>
                  </div>
                </div>
                {@const _ = createTOTPGenerator(account.totp, account.algorithm, account.id)}
              {/if}
            </div>
            <div class="w-1/3 overflow-hidden">
              {#if account.password === 'unable to decrypt' || account.totp === 'unable to decrypt'}
                <Tooltip
                  tip="The password/TOTP decryption failed, most likely due to a mismatch with the master password during the decryption process.">
                  <p class="text-right text-red-600">
                    Unable to decrypt
                    <QuestionIcon className="inline-block ml-1 hover:cursor-default w-4 h-4" />
                  </p>
                </Tooltip>
              {:else}
                <div class="flex flex-col">
                  <HoverCopyButton text={account.password} icon={KeyIcon} color="!text-neutral-400" direction="end" />
                </div>
              {/if}
            </div>
          </div>
        {/each}
      {/await}
    </section>
  {/key}
{:else if mode === 'view' && $masterPassword}
  <section id="no-accounts" style="background-image: url({group});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Accounts</h2>
    <p class="w-1/2 text-center">
      Keep track of your online accounts linked to this identity using entries. You can store/generate your passwords, usernames, and
      set up TOTP all in one spot
    </p>
    <button onclick={() => (mode = 'add')}>Add Account</button>
  </section>
{/if}

<MasterPassword {ws} {accounts} />
<AccountEdit {ws} target={target!} {mode} />

<style lang="postcss">
  #no-accounts {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  .wrapper {
    @apply flex h-24 items-center justify-between border-b border-neutral-700 px-8 py-2;
    @apply cursor-pointer select-none hover:bg-neutral-400/5;
  }

  .target {
    @apply bg-neutral-300/10 hover:bg-neutral-300/10;
  }
</style>
