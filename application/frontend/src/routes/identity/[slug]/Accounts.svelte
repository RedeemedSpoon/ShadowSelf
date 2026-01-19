<script lang="ts">
  import {KeyIcon, KeylockIcon, UserIcon, WWWIcon, UserAddIcon, UserEditIcon, UserDeleteIcon, QuestionIcon, BackIcon} from '$icon';
  import {ActionIcon, Tooltip, HoverCopyButton} from '$component';
  import {fetchIndex, modalIndex, masterPassword} from '$store';
  import type {Account, APIResponse} from '$type';
  import {writable} from 'svelte/store';
  import {decrypt} from '$cryptography';
  import * as OTPAuth from 'otpauth';
  import {lock, group} from '$image';
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  import AccountEdit from './sub-components/AccountEdit.svelte';

  const mode = writable<'view' | 'add' | 'edit'>('view');
  const target = writable<Account | null>(null);
  const accounts = writable<APIResponse>();

  onMount(async () => {
    $accounts = await fetchAPI('account', 'GET');
    $target = null;
  });

  function handleClick(account: Account) {
    if ($target?.id == account.id && account.website) {
      let websiteURL = account.website.startsWith('http') ? account.website : 'https://' + account.website;
      window.open(websiteURL, '_blank');
    }

    $target = account;
  }

  async function createTOTPGenerator(secret: string, algorithm: string, id: number) {
    await new Promise((resolve) => setTimeout(resolve, 10));

    const generator = new OTPAuth.TOTP({algorithm, secret});
    const element = document.getElementById(id.toString()) as HTMLParagraphElement;
    element.innerText = generator.generate();

    setInterval(() => (element.innerText = generator.generate()), 30000);
  }

  async function decryptAll(encryptedAccounts: APIResponse) {
    return await Promise.all(
      encryptedAccounts.accounts.map(async (account) => ({
        ...account,
        password: await decrypt(account.password),
        totp: account.totp ? await decrypt(account.totp) : null,
      })),
    );
  }

  async function changeModeToEdit() {
    $mode = 'edit';
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (const input of ['username', 'password', 'website', 'totp', 'algorithm']) {
      const element = document.querySelector('input[name="' + input + '"]') as HTMLInputElement;
      element.value = $target![input as keyof Account] as string;

      if (input === 'algorithm') element.click();
    }
  }

  async function deleteAccount() {
    const response = await fetchAPI('account/delete-account', 'DELETE', {id: $target!.id});
    if (response.err) return notify(response.err, 'alert');

    $accounts.accounts = $accounts.accounts.filter((account) => account.id !== (response.id as unknown));
    $mode = 'view';
    $fetchIndex = 0;
    $target = null;
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Account Vault</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col">
    <div class:hidden={$mode === 'view'}>
      <ActionIcon icon={BackIcon} action={() => ($mode = 'view')} title="Ignore Changes" />
    </div>
    <ActionIcon disabled={!$masterPassword} icon={UserAddIcon} action={() => ($mode = 'add')} title="Add Account" />
    <ActionIcon disabled={!$target} icon={UserEditIcon} action={changeModeToEdit} title="Edit Account" />
    <ActionIcon disabled={!$target} icon={UserDeleteIcon} action={deleteAccount} title="Delete Account" />
  </div>
</section>

{#if $mode === 'view' && $accounts?.accounts.length && $masterPassword}
  {#key $accounts.accounts}
    <section class="min-h-[40vh]">
      {#await decryptAll($accounts) then decryptedAccounts}
        {#each decryptedAccounts as account (account.id)}
          <div
            aria-hidden="true"
            onclick={() => handleClick(account as Account)}
            class="wrapper last:border-b-0 {$target && $target?.id == account.id && 'target'}">
            <div class="flex w-1/3 flex-col overflow-hidden">
              <HoverCopyButton text={account.username} icon={UserIcon} color="text-neutral-300!" />
              {#if account.website}
                <HoverCopyButton text={account.website} size="small" icon={WWWIcon} color="text-neutral-500!" />
              {/if}
            </div>
            <div class="w-1/3 overflow-hidden">
              {#if account.totp}
                <div class="flex flex-col items-center">
                  <HoverCopyButton id={account.id.toString()} icon={KeylockIcon} color="text-neutral-400!" />
                  <div class="relative mt-2 h-1 w-1/2 rounded-2xl bg-neutral-800">
                    <div class="animate-progress bg-primary-700 absolute top-0 left-0 h-full rounded-2xl"></div>
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
                  <HoverCopyButton text={account.password} icon={KeyIcon} color="text-neutral-400!" direction="end" />
                </div>
              {/if}
            </div>
          </div>
        {/each}
      {/await}
    </section>
  {/key}
{:else if $mode === 'view' && $masterPassword}
  <section id="no-accounts" style="background-image: url({group});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Accounts</h2>
    <p class="text-center md:w-1/2">
      Keep track of your accounts linked to this identity using entries. You can store/generate your passwords, usernames, and set up
      TOTP all in one spot
    </p>
    <button onclick={() => ($mode = 'add')}>Add Account</button>
  </section>
{:else if !$masterPassword}
  <section id="no-accounts" style="background-image: url({lock});">
    <h2 class="mt-12 text-center text-5xl text-neutral-300">Encryption Key Missing</h2>
    <p class="text-center md:w-1/2">
      Your local session is missing the decryption key. Re-enter your Master Password to restore access to this identity account vault.
    </p>
    <button onclick={() => ($modalIndex = 1)}>Enter Master Password</button>
  </section>
{/if}

<AccountEdit {accounts} {target} {mode} />

<style lang="postcss">
  @reference "$style";

  #no-accounts {
    @apply mt-12 mb-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  .wrapper {
    @apply flex h-24 items-center justify-between border-b border-neutral-700 py-2 md:px-8;
    @apply cursor-pointer select-none hover:bg-neutral-400/5;
  }

  .target {
    @apply bg-neutral-300/10 hover:bg-neutral-300/10;
  }
</style>
