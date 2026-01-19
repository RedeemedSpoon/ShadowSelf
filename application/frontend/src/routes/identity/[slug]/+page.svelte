<script lang="ts">
  import {currentSection, fetchIndex, handleResponse, identity, modalIndex, masterPassword} from '$store';
  import {InfoIcon, PhoneIcon, MultiUsersIcon, EmailIcon, WalletIcon} from '$icon';
  import {Modal, ConfirmModal, InputWithIcon, LoadingButton} from '$component';
  import type {APIResponse, Sections, WebSocketMessage} from '$type';
  import {decrypt, deriveMasterKey, encrypt} from '$cryptography';
  import {ChevronIcon, KeyIcon} from '$icon';
  import {browser} from '$app/environment';
  import type {PageProps} from './$types';
  import {slide} from 'svelte/transition';
  import {fetchAPI} from '$fetch';
  import {page} from '$app/state';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  import IdentityInformation from './Information.svelte';
  import IdentityAccounts from './Accounts.svelte';
  import IdentityCrypto from './Crypto.svelte';
  import IdentityPhone from './Phone.svelte';
  import IdentityEmail from './Email.svelte';

  let {data}: PageProps = $props();

  let buttonWrapper = $state() as HTMLDivElement;
  let ws = $state() as WebSocket;

  $identity = data.identity!;
  $currentSection = (page.url.hash?.slice(1) || 'info') as Sections;

  const className = {
    label: 'bg-neutral-900/50! border-neutral-700!',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 bg-neutral-900/50! border-neutral-700!',
    wrapper: 'w-2/3',
  };

  const sectionsNames = [
    {name: 'Information', icon: InfoIcon},
    {name: 'Email', icon: EmailIcon},
    {name: 'Phone', icon: PhoneIcon},
    {name: 'Crypto', icon: WalletIcon},
    {name: 'Accounts', icon: MultiUsersIcon},
  ];

  const allSections = {
    info: IdentityInformation,
    email: IdentityEmail,
    phone: IdentityPhone,
    crypto: IdentityCrypto,
    account: IdentityAccounts,
  };

  function handleClick(section: Sections) {
    if (section) window.location.hash = section;
    $currentSection = section;

    buttonWrapper.childNodes.forEach((node) => {
      (node as HTMLButtonElement).disabled = true;
      setTimeout(() => ((node as HTMLButtonElement).disabled = false), 500);
    });
  }

  async function setMasterPassword() {
    $fetchIndex = 1;
    await new Promise((resolve) => setTimeout(resolve, 750));

    const inputElement = document.querySelector('input#set-master') as HTMLInputElement;
    const password = inputElement.value || 'test';

    const newKey = await deriveMasterKey(password, $identity.id);
    const keyBuffer = await crypto.subtle.exportKey('raw', newKey);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));

    $masterPassword = base64Key;
    localStorage.setItem('key-' + $identity.id, base64Key);
    window.location.reload();
  }

  async function changeMasterPassword() {
    $fetchIndex = 1;
    await new Promise((resolve) => setTimeout(resolve, 750));

    // Account vault
    const inputElement = document.querySelector('input#change-master') as HTMLInputElement;
    const password = inputElement.value || 'test';

    const newKey = await deriveMasterKey(password, $identity.id);
    const keyBuffer = await crypto.subtle.exportKey('raw', newKey);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));

    const accounts: APIResponse = await fetchAPI('account', 'GET');
    const updatedAccounts = await Promise.all(
      accounts.accounts.map(async (account) => {
        const oldPassword = await decrypt(account.password);
        const oldTotp = account.totp ? await decrypt(account.totp) : 'unable to decrypt';

        if (oldPassword === 'unable to decrypt' && oldTotp === 'unable to decrypt') return account;

        return {
          id: account.id,
          password: await encrypt(oldPassword, newKey),
          totp: account.totp ? await encrypt(oldTotp, newKey) : null,
        };
      }),
    );

    const account_response = await fetchAPI('account/update-encryption', 'PUT', {accounts: updatedAccounts});
    if (account_response.err) return notify(account_response.err, 'alert');

    // Crypto wallet
    const mnemonic = await decrypt($identity.wallet_blob);
    const blob = await encrypt(mnemonic, newKey);

    const wallet_response = await fetchAPI('crypto/update-blob', 'PUT', {blob});
    if (wallet_response.err) return notify(wallet_response.err, 'alert');

    $masterPassword = base64Key;
    localStorage.setItem('key-' + $identity.id, base64Key);
    window.location.reload();
  }

  onMount(() => {
    $masterPassword = localStorage.getItem('key-' + $identity.id) || '';
    let pingInterval: unknown;

    ws = new WebSocket(`wss://${page.url.hostname}/ws-api/${data.identity?.id}`);

    ws.onopen = () => {
      pingInterval = setInterval(() => ws?.send('ping'), 5000);
    };

    ws.onerror = () => {
      notify('Something went horribly wrong. Try reloading the page.', 'alert');
    };

    ws.onclose = (ws) => {
      clearInterval(pingInterval as number);
      if (ws.code === 1014) notify(ws.reason, 'alert');
    };

    ws.onmessage = (event) => {
      if (Number(event.data) == event.data) return;
      if (event.data === 'pong') return;

      const response = JSON.parse(event.data) as WebSocketMessage;
      $handleResponse(response);
    };

    window.onbeforeunload = () => ws.close();
  });
</script>

<svelte:head>
  <title>ShadowSelf - {data.identity?.name}'s Identity</title>
  <meta name="description" content="{data.identity?.name}'s ShadowSelf Identity, use it to protect yourself and your data." />
</svelte:head>

<div id="identity">
  {#if data.identity && browser}
    <div id="button-wrapper" bind:this={buttonWrapper} class="flex h-16">
      {#each Object.keys(allSections) as section, i (i)}
        {@const Icon = sectionsNames[i].icon}
        <button class:main={section === $currentSection} onclick={() => handleClick(section as Sections)}>
          <Icon className="h-6 w-6" />
          <span class="max-sm:hidden">{sectionsNames[i].name}</span>
        </button>
      {/each}
    </div>

    {#key $currentSection}
      {@const SvelteComponent = allSections[$currentSection]}
      <div class="mt-8 mb-12 w-full md:px-8" in:slide={{delay: 400, duration: 350}} out:slide={{duration: 350}}>
        <SvelteComponent />
      </div>
    {/key}

    <hr class="mb-8 h-0.5 w-full" />
    <div class="flex w-full justify-between px-8 max-sm:flex-col-reverse">
      <a href="/dashboard">
        <button class="alt border-none">← Back</button>
      </a>
      <form class="flex items-center" method="POST">
        {#key $masterPassword}
          {#if $masterPassword}
            <button type="button" onclick={() => ($modalIndex = 2)} class="alt w-fit p-0">Change Local Master Password</button>
          {:else}
            <button type="button" onclick={() => ($modalIndex = 1)} class="alt w-fit p-0">Set Local Master Password</button>
          {/if}
        {/key}
        <div class="px-2 font-bold text-neutral-500 select-none">|</div>
        <button type="button" onclick={() => ($modalIndex = 3)} class="alt w-fit p-0">Delete Identity</button>
        <input type="hidden" name="id" value={data.identity.id} />
        <ConfirmModal id={3} text="Deleting permanently this identity" name="delete" />
        <Modal id={1}>
          <div class="flex flex-col items-center gap-8 p-4 sm:p-8">
            <h3 class="w-full text-3xl! font-semibold text-neutral-300 md:text-5xl!">Restore Master Password</h3>
            <p class="md:w-[40vw]">
              Enter the Master Password previously set for this identity to decrypt your account vault and crypto wallet on this
              device.
              <br /><b>Without this specific password, your encrypted data cannot be retrieved.</b>
            </p>
            <InputWithIcon {className} icon={KeyIcon} type="password" placeholder="Password" name="set-master" />
            <LoadingButton type="button" className="w-2/3" onclick={setMasterPassword}>Change Password</LoadingButton>
          </div>
        </Modal>
        <Modal id={2}>
          <div class="flex flex-col items-center gap-8 p-4 sm:p-8">
            <h3 class="w-full text-3xl! font-semibold text-neutral-300 md:text-5xl!">Change Master Password</h3>
            <p class="md:w-[40vw]">
              Immediately re-encrypt your accounts vault and crypto wallet with a new password. You will need it to access your data on
              a new device or browser.<br /><b>Irreversible: Forgotten passwords mean total data loss.</b>
            </p>
            <InputWithIcon {className} icon={KeyIcon} type="password" placeholder="Password" name="change-master" />
            <LoadingButton type="button" className="w-2/3" onclick={changeMasterPassword}>Change Password</LoadingButton>
          </div>
        </Modal>
      </form>
    </div>
  {:else}
    <div class="flex min-h-[50vh] flex-col items-center justify-center gap-8">
      <h1>Identity Not Found</h1>
      <p class="text-center">
        The identity you're looking for doesn't exist, or your account isn't the owner of the identity.
        <br class="max-lg:hidden" /> Please verify the URL and try again.
      </p>
      <a href="/dashboard">
        <button class="flex items-center gap-1">
          Dashboard<ChevronIcon />
        </button>
      </a>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "$style";

  #identity {
    @apply mx-auto my-[10rem] flex w-3/4 flex-col items-center text-neutral-400 sm:w-5/6 xl:w-2/3;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }

  #button-wrapper button {
    @apply flex items-center gap-2 border-b bg-none text-neutral-500 shadow-transparent max-md:sm:-mx-3 lg:px-[4vw];
    @apply rounded-none border-b border-neutral-500 transition-colors duration-500 hover:border-neutral-400 hover:text-neutral-400;
    @apply disabled:cursor-pointer disabled:opacity-100 max-md:sm:scale-90;
  }

  .main {
    @apply !border-b-[3px] !border-neutral-300 !text-neutral-300;
  }
</style>
