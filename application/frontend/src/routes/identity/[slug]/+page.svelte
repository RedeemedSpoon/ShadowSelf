<script lang="ts">
  import LoadingButton from '$component/buttons/LoadingButton.svelte';
  import InputWithIcon from '$component/inputs/InputWithIcon.svelte';
  import ConfirmModal from '$component/special/ConfirmModal.svelte';
  import Modal from '$component/containers/Modal.svelte';

  import MultiUsersIcon from '$icon/user/MultiUsers.svelte';
  import ChevronIcon from '$icon/navigation/Chevron.svelte';
  import EmailIcon from '$icon/communication/Email.svelte';
  import PhoneIcon from '$icon/communication/Phone.svelte';
  import WalletIcon from '$icon/finance/Wallet.svelte';
  import InfoIcon from '$icon/status/Info.svelte';
  import KeyIcon from '$icon/security/Key.svelte';

  import IdentityInformation from './information-tab/Information.svelte';
  import IdentityAccount from './account-tab/Account.svelte';
  import IdentityCrypto from './crypto-tab/Crypto.svelte';
  import IdentityPhone from './phone-tab/Phone.svelte';
  import IdentityEmail from './email-tab/Email.svelte';

  import {pendingID, handleResponse, identity, activeModal, masterPassword} from '$store';
  import {DEFAULT_MASTER_PASSWORD, SECTIONS_ORDER, SLEEP_DURATION} from '$constant';
  import type {AccountAPI, CryptoAPI, Sections, WebSocketMessage} from '$type';
  import {decrypt, deriveMasterKey, encrypt} from '$utils/cryptography';
  import {browser} from '$app/environment';
  import {fetchAPI} from '$utils/webfetch';
  import type {PageProps} from './$types';
  import {slide} from 'svelte/transition';
  import {notify} from '$utils/shared';
  import {page} from '$app/state';
  import {onMount} from 'svelte';

  let {data}: PageProps = $props();

  let currentSection = $state('info') as Sections;
  let buttonWrapper = $state() as HTMLDivElement;
  let ws = $state() as WebSocket;

  currentSection = (page.url.hash?.slice(1) || 'info') as Sections;
  $identity = (() => data.identity)()!;

  const className = {
    label: 'bg-neutral-900/50! border-neutral-700!',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 bg-neutral-900/50! border-neutral-700!',
    wrapper: 'w-2/3',
  };

  const sectionData = {
    info: {name: 'Information', icon: InfoIcon, component: IdentityInformation},
    email: {name: 'Email', icon: EmailIcon, component: IdentityEmail},
    phone: {name: 'Phone', icon: PhoneIcon, component: IdentityPhone},
    crypto: {name: 'Crypto', icon: WalletIcon, component: IdentityCrypto},
    account: {name: 'Accounts', icon: MultiUsersIcon, component: IdentityAccount},
  };

  function handleClick(section: Sections) {
    if (section) window.location.hash = section;
    currentSection = section;

    buttonWrapper.childNodes.forEach((node: any) => {
      node.disabled = true;
      setTimeout(() => (node.disabled = false), 500);
    });
  }

  async function setMasterPassword() {
    $pendingID = 1;
    await new Promise((resolve) => setTimeout(resolve, SLEEP_DURATION));

    const inputElement = document.querySelector('input#set-master') as HTMLInputElement;
    const password = inputElement.value || DEFAULT_MASTER_PASSWORD;

    const newKey = await deriveMasterKey(password, $identity.id);
    const keyBuffer = await crypto.subtle.exportKey('raw', newKey);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));

    $masterPassword = base64Key;
    localStorage.setItem('key-' + $identity.id, base64Key);
    window.location.reload();
  }

  async function changeMasterPassword() {
    $pendingID = 1;
    await new Promise((resolve) => setTimeout(resolve, SLEEP_DURATION));

    // Account vault
    const inputElement = document.querySelector('input#change-master') as HTMLInputElement;
    const password = inputElement.value || DEFAULT_MASTER_PASSWORD;

    const newKey = await deriveMasterKey(password, $identity.id);
    const keyBuffer = await crypto.subtle.exportKey('raw', newKey);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));

    const accounts = await fetchAPI<AccountAPI>('account', 'GET');
    const updatedAccounts = await Promise.all(
      accounts.accounts!.map(async (account) => {
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

    const accountResponse = await fetchAPI<AccountAPI>('account/update-encryption', 'PUT', {accounts: updatedAccounts});
    if (accountResponse.err) return notify(accountResponse.err, 'alert');

    // Crypto wallet
    const mnemonic = await decrypt($identity.walletBlob);
    const blob = await encrypt(mnemonic, newKey);

    const keys = {
      viewKey: await encrypt(await decrypt($identity.walletKeys.xmr.viewKey), newKey),
      spendKey: await encrypt(await decrypt($identity.walletKeys.xmr.spendKey), newKey),
      address: await encrypt(await decrypt($identity.walletKeys.xmr.address), newKey),
    };

    const walletResponse = await fetchAPI<CryptoAPI>('crypto/update-encryption', 'PUT', {blob, keys});
    if (walletResponse.err) return notify(walletResponse.err, 'alert');

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
  {#if data.isFrozen}
    <div class="flex min-h-[50vh] flex-col items-center justify-center gap-8">
      <h1>Identity Frozen</h1>
      <p class="text-center">
        This identity has been temporarily frozen due to a failed subscription payment.
        <br class="max-lg:hidden" /> Please update your payment method in the billing portal to restore access.
        <br class="max-lg:hidden" /> If the payment issue is not resolved within 7 days, this identity will be
        <b>permanently deleted</b>.
      </p>
      <a href="/dashboard">
        <button class="flex items-center gap-1"> ← Back to Dashboard </button>
      </a>
    </div>
  {:else if data.identity && browser}
    <div id="button-wrapper" bind:this={buttonWrapper} class="flex h-16">
      {#each SECTIONS_ORDER as section (section)}
        {@const {icon: Icon, name} = sectionData[section as 'info']}
        <button class:main={section === currentSection} onclick={() => handleClick(section as Sections)}>
          <Icon className="h-6 w-6" />
          <span class="max-sm:hidden">{name}</span>
        </button>
      {/each}
    </div>

    {#key currentSection}
      {@const SvelteComponent = sectionData[currentSection].component}
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
            <button type="button" onclick={() => ($activeModal = 2)} class="alt w-fit p-0">Change Local Master Password</button>
          {:else}
            <button type="button" onclick={() => ($activeModal = 1)} class="alt w-fit p-0">Set Local Master Password</button>
          {/if}
        {/key}
        <div class="px-2 font-bold text-neutral-500 select-none">|</div>
        <button type="button" onclick={() => ($activeModal = 3)} class="alt w-fit p-0">Delete Identity</button>
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
    @apply mx-auto my-40 flex w-3/4 flex-col items-center text-neutral-400 sm:w-5/6 xl:w-2/3;
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
    @apply border-b-[3px]! border-neutral-300! text-neutral-300!;
  }
</style>
