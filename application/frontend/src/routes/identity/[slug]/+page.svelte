<script lang="ts">
  import LoadingState from '$component/ui/LoadingState.svelte';
  import {enhance} from '$app/forms';
  import {goto, invalidateAll} from '$app/navigation';
  import {page} from '$app/state';
  import {get} from 'svelte/store';
  import {identity, vaultKey, moneroData} from '$store';
  import type {FullIdentity, IdentityMetadata, AccountAPI} from '$type';
  import {request} from '$utils/webfetch';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import type {PageProps} from './$types';
  import type {Component} from 'svelte';

  type ServiceProps = {account: FullIdentity; onupdate: (patch: Partial<FullIdentity>) => void; onunlock: () => void};

  const panels = {
    info: () => import('$component/console/Profile.svelte'),
    account: () => import('$component/console/Vault.svelte'),
    email: () => import('$component/console/Mail.svelte'),
    phone: () => import('$component/console/Phone.svelte'),
    crypto: () => import('$component/console/Wallet.svelte'),
  };

  let {data, form}: PageProps = $props();
  let account = $derived<IdentityMetadata | null>(data.identity);
  let section = $state<keyof typeof panels>('info');
  const panel = $derived(panels[section]().then((module) => module.default as Component<ServiceProps>));
  let unlockOpen = $state(false);
  let rotateOpen = $state(false);
  let deleteOpen = $state(false);
  let password = $state('');
  let confirmPassword = $state('');
  let pending = $state(false);
  let message = $state('');
  let liveStatus = $state('Connecting');
  let keyEpoch = 0;
  const tabs = [
    {id: 'info', label: 'Information', icon: 'user'},
    {id: 'account', label: 'Account vault', icon: 'lock'},
    {id: 'email', label: 'Email', icon: 'mail'},
    {id: 'phone', label: 'Phone', icon: 'phone'},
    {id: 'crypto', label: 'Crypto wallet', icon: 'wallet'},
  ];

  function update(patch: Partial<FullIdentity>) {
    if (account?.status === 'active') {
      account = {...account, ...patch};
      identity.set(account);
    }
  }

  function closePassword() {
    keyEpoch++;
    password = '';
    confirmPassword = '';
    message = '';
  }

  function lock() {
    keyEpoch++;
    vaultKey.set(null);
    moneroData.set({address: '', viewKey: '', spendKey: ''});
    unlockOpen = false;
    rotateOpen = false;
    closePassword();
  }

  async function unlock(event: SubmitEvent) {
    event.preventDefault();

    if (!account || account.status !== 'active') {
      return;
    }

    pending = true;
    message = '';

    const epoch = keyEpoch;
    const identityID = account.id;
    const candidate = password;

    try {
      const {deriveMasterKey, decrypt} = await import('$utils/cryptography');
      const key = await deriveMasterKey(candidate, identityID);

      if (!(await decrypt(account.walletBlob, key))) {
        throw new Error('This master password could not unlock the identity.');
      }

      if (epoch !== keyEpoch || account.id !== identityID) {
        return;
      }

      vaultKey.set(key);
      unlockOpen = false;
      closePassword();
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not unlock this identity.';
    } finally {
      pending = false;
    }
  }

  async function rotate(event: SubmitEvent) {
    event.preventDefault();

    if (!account || account.status !== 'active') {
      return;
    }

    pending = true;
    message = '';

    const originalKey = get(vaultKey);
    const epoch = keyEpoch;
    const originalAccount = account;

    try {
      const {deriveMasterKey, encrypt} = await import('$utils/cryptography');
      const {idbOperation} = await import('$utils/monero');

      if (!originalKey) {
        throw new Error('Unlock the identity before changing its password.');
      }

      if (password.length < 12 || password !== confirmPassword) {
        throw new Error('Use at least 12 characters and matching passwords.');
      }

      await navigator.locks.request(`shadowself-xmr-${originalAccount.id}`, {ifAvailable: true}, async (lock) => {
        if (!lock || !originalAccount) {
          throw new Error('Wait for the wallet operation to finish, then retry.');
        }

        const result = await request<AccountAPI>(`/identities/${originalAccount.id}/vault`);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const key = await deriveMasterKey(password, originalAccount.id);

        const entries = await Promise.all(
          result.data.accounts.map(async (entry) => ({
            ...entry,
            password: entry.password ? await encrypt(await decrypted(entry.password, originalKey), key) : '',
            totp: entry.totp ? await encrypt(await decrypted(entry.totp, originalKey), key) : null,
          })),
        );

        const blob = await encrypt(await decrypted(originalAccount.walletBlob, originalKey), key);

        const keys = {
          address: await encrypt(await decrypted(originalAccount.walletKeys.xmr.address, originalKey), key),
          viewKey: await encrypt(await decrypted(originalAccount.walletKeys.xmr.viewKey, originalKey), key),
          spendKey: await encrypt(await decrypted(originalAccount.walletKeys.xmr.spendKey, originalKey), key),
        };

        if (epoch !== keyEpoch || account?.id !== originalAccount.id || get(vaultKey) !== originalKey) {
          throw new Error('The identity was locked. Unlock it before changing the password.');
        }

        const rotated = await request<{vaultRevision: number}>(
          `/identities/${originalAccount.id}/vault/encryption`,
          'PUT',
          {
            accounts: entries,
            blob,
            keys,
            vaultRevision: result.data.vaultRevision,
          },
        );

        if (!rotated.ok) {
          throw new Error(rotated.error);
        }

        const oldCache = `${originalAccount.id}:${originalAccount.walletBlob}`;

        if (account?.id !== originalAccount.id) {
          return;
        }

        update({
          walletBlob: blob,
          walletKeys: {...originalAccount.walletKeys, xmr: keys},
          vaultRevision: rotated.data.vaultRevision,
        });

        if (epoch === keyEpoch) {
          vaultKey.set(key);
        } else {
          vaultKey.set(null);
          moneroData.set({address: '', viewKey: '', spendKey: ''});
        }

        rotateOpen = false;
        closePassword();
        await idbOperation('delete', oldCache).catch(() => {});
      });
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not change the master password.';
    } finally {
      pending = false;
    }
  }

  async function decrypted(value: string, key: CryptoKey) {
    const {decrypt} = await import('$utils/cryptography');
    const plain = await decrypt(value, key);

    if (!plain) {
      throw new Error('Could not decrypt all identity secrets. Nothing was changed.');
    }

    return plain;
  }

  function select(id: string) {
    void goto(`#${id}`, {replaceState: true, noScroll: true, keepFocus: true});
  }

  $effect(() => {
    const hash = page.url.hash.slice(1);
    section = tabs.some((tab) => tab.id === hash) ? (hash as keyof typeof panels) : 'info';
  });

  $effect(() => {
    const current = data.identity;
    lock();

    if (!current || current.status !== 'active') {
      return;
    }

    identity.set(current);

    let active = true;
    liveStatus = 'Connecting';

    const socket = new WebSocket(
      `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/identities/${current.id}/events`,
    );
    socket.onopen = () => {
      if (active) {
        liveStatus = 'Live updates connected';
      }
    };
    socket.onclose = () => {
      if (active) {
        liveStatus = 'Live updates disconnected. Refresh to load new messages.';
      }
    };
    socket.onerror = () => {
      if (active) {
        liveStatus = 'Live updates unavailable. Refresh to load new messages.';
      }
    };
    socket.onmessage = (event) => {
      if (!active || event.data === 'pong') {
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent('identity-update', {detail: {...payload, identityID: current.id}}));
      } catch {
        liveStatus = 'Invalid live update received. Refresh to reload.';
      }
    };

    const ping = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
      }
    }, 20000);

    return () => {
      active = false;
      clearInterval(ping);
      socket.close();
      lock();
      identity.set(null);
    };
  });
</script>

<svelte:head><title>{account?.name || 'Identity'} | ShadowSelf</title></svelte:head>
{#if !account}<div class="empty-state">
    <Icon name="warning" size={36} />
    <h1>{data.status === 404 ? 'Identity not found' : 'Identity could not be loaded'}</h1>
    <p>{data.loadError}</p>
    <div class="button-row">
      <Button variant="secondary" icon="refresh" onclick={() => invalidateAll()}>Retry</Button><a
        class="control-button quiet"
        href="/dashboard">Back to identities</a>
    </div>
  </div>
{:else}
  <div class="page-heading">
    <div>
      <div class="eyebrow">IDENTITY / {account.id.slice(0, 8)}</div>
      <h1>{account.name || 'Identity setup'}</h1>
      <p>{account.location}<span class="badge {account.status} identity-status">{account.status}</span></p>
    </div>
    <div class="button-row">
      {#if account.status === 'active'}{#if $vaultKey}<Button variant="secondary" icon="lock" onclick={lock}
            >Lock secrets</Button
          ><Button variant="quiet" icon="key" onclick={() => (rotateOpen = true)}>Change master password</Button
          >{:else}<Button variant="secondary" icon="key" onclick={() => (unlockOpen = true)}>Unlock secrets</Button
          >{/if}{/if}<Button
        variant="quiet"
        icon="trash"
        aria-label="Delete identity"
        onclick={() => (deleteOpen = true)} />
    </div>
  </div>
  {#if account.status === 'frozen'}<Status
      message="This identity's subscription has expired. Renew it to restore access to its services." /><a
      class="control-button"
      href="/purchase?id={account.id}&plan={account.plan}">Renew identity</a
    >{:else if account.status === 'inactive'}<Status
      message="Setup is not complete. Continue provisioning this identity." /><a
      class="control-button"
      href="/create?id={account.id}">Continue setup</a
    >{:else}
    <div class="tabs" aria-label="Identity services">
      {#each tabs as tab (tab.id)}<button
          aria-pressed={section === tab.id}
          class:active={section === tab.id}
          onclick={() => select(tab.id)}><Icon name={tab.icon} size={17} />{tab.label}</button
        >{/each}
    </div>
    {#key account.id}
      <div>
        {#await panel}
          <LoadingState label={`Loading ${tabs.find((tab) => tab.id === section)?.label || 'service'}`} />
        {:then Panel}
          {#if account.status === 'active'}
            <Panel {account} onupdate={update} onunlock={() => (unlockOpen = true)} />
          {/if}
        {:catch}
          <Status message="This service could not be loaded. Reload the page to retry." kind="error" />
        {/await}
      </div>
    {/key}
    <div class="live-status">{liveStatus}</div>{/if}
{/if}
<Dialog bind:open={unlockOpen} title="Unlock identity secrets" onclose={closePassword}
  ><p>Enter the master password for this identity. The key stays in memory until you lock it or leave this page.</p>
  <form onsubmit={unlock}>
    <div class="field password-field">
      <label for="unlock-password">Master password</label><input
        id="unlock-password"
        type="password"
        autocomplete="off"
        bind:value={password}
        required />
    </div>
    <Status {message} kind="error" /><Button type="submit" loading={pending} icon="key">Unlock vault and wallet</Button>
  </form></Dialog>
<Dialog bind:open={rotateOpen} title="Change master password" onclose={closePassword}
  ><p>
    This re-encrypts every vault secret and the wallet atomically. Keep the new password safe. Forgotten passwords
    cannot be recovered.
  </p>
  <form onsubmit={rotate}>
    <div class="field password-field">
      <label for="new-master">New master password</label><input
        id="new-master"
        type="password"
        minlength="12"
        bind:value={password}
        autocomplete="new-password"
        required />
    </div>
    <div class="field">
      <label for="confirm-master">Confirm new password</label><input
        id="confirm-master"
        type="password"
        bind:value={confirmPassword}
        autocomplete="new-password"
        required />
    </div>
    <Status {message} kind="error" /><Button type="submit" loading={pending}>Re-encrypt identity</Button>
  </form></Dialog>
<Dialog bind:open={deleteOpen} title="Delete this identity"
  ><p>
    Deletion cancels its subscription and removes its profile, vault and messaging resources. Move any wallet funds
    before proceeding.
  </p>
  <form method="POST" action="?/delete" use:enhance>
    <div class="field password-field">
      <label for="delete-password">Account password</label><input
        id="delete-password"
        name="currentPassword"
        type="password"
        autocomplete="current-password"
        required />
    </div>
    <Status message={form?.message || ''} kind="error" /><Button variant="danger" type="submit" icon="trash"
      >Delete identity</Button>
  </form></Dialog>

<style>
  .identity-status {
    margin-left: 10px;
  }
  .password-field {
    margin-top: 20px;
  }
  .live-status {
    margin-top: 30px;
    font-size: 10px;
    color: #62728e;
  }
</style>
