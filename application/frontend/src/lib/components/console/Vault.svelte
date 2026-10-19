<script lang="ts">
  import LoadingState from '$component/ui/LoadingState.svelte';
  import {onMount} from 'svelte';
  import {invalidateAll} from '$app/navigation';
  import {TOTP} from 'otpauth';
  import {vaultKey, moneroData} from '$store';
  import {request} from '$utils/webfetch';
  import {decrypt, encrypt} from '$utils/cryptography';
  import type {Account, AccountAPI, FullIdentity} from '$type';
  import Button from '$component/ui/Button.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Copy from '$component/ui/Copy.svelte';

  let {
    account,
    onupdate,
    onunlock,
  }: {account: FullIdentity; onupdate: (patch: Partial<FullIdentity>) => void; onunlock: () => void} = $props();
  let entries = $state<Account[]>([]);
  let plain = $state<Account[]>([]);
  let pending = $state(false);
  let loaded = $state(false);
  let decryptedReady = $state(false);
  let error = $state('');
  let query = $state('');
  let editOpen = $state(false);
  let deleteTarget = $state<Account | null>(null);
  let revealed = $state<number[]>([]);
  let clock = $state(Date.now());
  let edit = $state({id: 0, username: '', website: '', password: '', totp: '', algorithm: 'SHA1'});
  let revision = $state(0);
  let loadEpoch = 0;
  const readOnly = $derived(account.status === 'frozen');
  const visible = $derived(
    plain.filter((entry) => `${entry.username} ${entry.website || ''}`.toLowerCase().includes(query.toLowerCase())),
  );

  $effect(() => {
    const key = $vaultKey;
    const ciphertext = entries;
    let cancelled = false;
    plain = [];
    revealed = [];
    decryptedReady = false;

    if (!key) {
      editOpen = false;
      deleteTarget = null;
      edit = {id: 0, username: '', website: '', password: '', totp: '', algorithm: 'SHA1'};

      return;
    }

    void Promise.all(
      ciphertext.map(async (entry) => {
        const password = entry.password ? await decrypt(entry.password, key) : '';

        const totp = entry.totp ? await decrypt(entry.totp, key) : '';

        if ((entry.password && !password) || (entry.totp && !totp)) {
          throw new Error('A vault entry could not be decrypted. Lock and unlock with the correct master password.');
        }

        return {...entry, password, totp};
      }),
    )
      .then((value) => {
        if (!cancelled) {
          plain = value;
          decryptedReady = true;
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          error = cause.message;
        }
      });

    return () => {
      cancelled = true;
    };
  });

  async function load() {
    const epoch = ++loadEpoch;
    const blob = account.walletBlob;
    pending = true;
    error = '';

    const result = await request<AccountAPI>(`/identities/${account.id}/vault`);

    if (epoch !== loadEpoch || account.walletBlob !== blob) {
      return;
    }

    pending = false;
    loaded = true;

    if (!result.ok) {
      error = result.error;

      return;
    }

    if (result.data.walletBlob !== blob) {
      vaultKey.set(null);
      moneroData.set({address: '', viewKey: '', spendKey: ''});
      entries = [];
      revision = 0;
      error = 'The master password changed. Unlock this identity again before continuing.';
      await invalidateAll();

      return;
    }

    entries = result.data.accounts;
    revision = result.data.vaultRevision;
    onupdate({vaultRevision: revision});
  }

  function startEdit(entry?: Account) {
    if (readOnly) {
      return;
    }

    edit = entry
      ? {...entry, website: entry.website || '', totp: entry.totp || '', algorithm: entry.algorithm || 'SHA1'}
      : {id: 0, username: '', website: '', password: '', totp: '', algorithm: 'SHA1'};
    editOpen = true;
    error = '';
  }

  function generatePassword() {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    edit.password = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  function code(entry: Account) {
    const time = clock;

    try {
      return entry.totp
        ? new TOTP({algorithm: entry.algorithm || 'SHA1', secret: entry.totp}).generate({timestamp: time})
        : '';
    } catch {
      return 'Invalid TOTP secret';
    }
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();

    if (readOnly) {
      return;
    }

    pending = true;
    error = '';

    try {
      if (edit.totp) {
        new TOTP({algorithm: edit.algorithm, secret: edit.totp}).generate();
      }

      const key = $vaultKey;

      if (!key) {
        throw new Error('Unlock the vault before saving.');
      }

      const body = {
        ...edit,
        password: edit.password ? await encrypt(edit.password, key) : '',
        totp: edit.totp ? await encrypt(edit.totp, key) : null,
        vaultRevision: revision,
        walletBlob: account.walletBlob,
      };

      if ($vaultKey !== key) {
        throw new Error('The vault was locked. Unlock it before saving.');
      }

      const result = await request(`/identities/${account.id}/vault/entries`, edit.id ? 'PATCH' : 'POST', body);

      if (!result.ok) {
        if (result.status === 409) {
          await load();
        }

        throw new Error(result.error);
      }

      editOpen = false;
      edit = {id: 0, username: '', website: '', password: '', totp: '', algorithm: 'SHA1'};
      await load();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not save this entry.';
    } finally {
      pending = false;
    }
  }

  async function remove() {
    if (!deleteTarget || readOnly) {
      return;
    }

    pending = true;
    error = '';

    const result = await request(`/identities/${account.id}/vault/entries`, 'DELETE', {
      id: deleteTarget.id,
      vaultRevision: revision,
      walletBlob: account.walletBlob,
    });
    pending = false;

    if (!result.ok) {
      error = result.error;

      if (result.status === 409) {
        await load();
      }

      return;
    }

    deleteTarget = null;
    await load();
  }

  function exportAccounts() {
    if (!$vaultKey || !loaded || !decryptedReady) {
      return;
    }

    const url = URL.createObjectURL(new Blob([JSON.stringify(plain, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-${account.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  onMount(() => {
    void load();
    const timer = setInterval(() => (clock = Date.now()), 1000);

    return () => {
      loadEpoch++;
      clearInterval(timer);
    };
  });
</script>

<div class="section-heading">
  <div>
    <h2>Account vault</h2>
  </div>
  <div class="button-row">
    <Button
      variant="quiet"
      icon="download"
      disabled={!$vaultKey || !loaded || !decryptedReady || pending}
      onclick={exportAccounts}>Export decrypted JSON</Button>
    {#if !readOnly}<Button icon="plus" disabled={!$vaultKey} onclick={() => startEdit()}>Add account</Button>{/if}
  </div>
</div>
{#if readOnly}<Status
    message="Your subscription has expired. Saved accounts remain available to read and export. Renew to edit them." />{/if}
<Status message={error} kind="error" />
{#if !$vaultKey}<div class="empty-state">
    <Icon name="lock" size={40} />
    <h2>Vault locked</h2>
    <p>Requires this identity's master password.</p>
    <Button icon="key" onclick={onunlock}>Unlock vault</Button>
  </div>
{:else if pending && !loaded}<LoadingState label="Loading vault" />
{:else if !loaded || (error && !entries.length)}<Button variant="secondary" loading={pending} onclick={load}
    >Retry loading vault</Button>
{:else if !entries.length}<div class="empty-state">
    <Icon name="key" size={40} />
    <h2>No accounts saved</h2>
    {#if !readOnly}<Button icon="plus" onclick={() => startEdit()}>Add account</Button>{/if}
  </div>
{:else}<div class="field">
    <label for="vault-search">Find an account</label><input
      id="vault-search"
      type="search"
      bind:value={query}
      placeholder="Search username or website" />
  </div>
  <div class="vault-list">
    {#each visible as entry (entry.id)}<article class="panel vault-entry">
        <div class="section-heading">
          <div>
            <h3>{entry.username || 'Unnamed account'}</h3>
            <small>{entry.website || 'No website'}</small>
          </div>
          {#if !readOnly}<div class="button-row">
              <Button
                variant="quiet"
                icon="edit"
                aria-label="Edit {entry.username}"
                onclick={() => startEdit(entry)} /><Button
                variant="quiet"
                icon="trash"
                aria-label="Delete {entry.username}"
                onclick={() => (deleteTarget = entry)} />
            </div>{/if}
        </div>
        <div class="vault-values">
          <div>
            <small>Password</small><Copy
              value={entry.password}
              concealed={!revealed.includes(entry.id)}
              label="Copy password" /><Button
              variant="quiet"
              onclick={() =>
                (revealed = revealed.includes(entry.id)
                  ? revealed.filter((id) => id !== entry.id)
                  : [...revealed, entry.id])}
              >{revealed.includes(entry.id) ? 'Hide password' : 'Reveal password'}</Button>
          </div>
          {#if entry.totp}<div>
              <small>Authenticator · {30 - (Math.floor(clock / 1000) % 30)}s</small><Copy
                value={code(entry)}
                label="Copy code" />
            </div>{/if}
        </div>
      </article>{/each}
  </div>
  {#if !visible.length}<p>No accounts match this search.</p>{/if}{/if}
<Dialog
  bind:open={editOpen}
  title={edit.id ? 'Edit vault account' : 'Add vault account'}
  onclose={() => (edit = {id: 0, username: '', website: '', password: '', totp: '', algorithm: 'SHA1'})}
  ><form onsubmit={save}>
    <div class="field">
      <label for="entry-username">Username</label><input
        id="entry-username"
        bind:value={edit.username}
        maxlength="25"
        required
        autocomplete="off" />
    </div>
    <div class="field">
      <label for="entry-website">Website</label><input
        id="entry-website"
        bind:value={edit.website}
        type="url"
        maxlength="2048"
        placeholder="https://example.com" />
    </div>
    <div class="field">
      <label for="entry-password">Password</label><input
        id="entry-password"
        bind:value={edit.password}
        type="password"
        autocomplete="new-password"
        required /><Button variant="quiet" type="button" onclick={generatePassword}>Generate a random password</Button>
    </div>
    <div class="field">
      <label for="entry-totp">TOTP secret</label><input
        id="entry-totp"
        bind:value={edit.totp}
        autocomplete="off"
        placeholder="Optional base32 secret" />
    </div>
    <div class="field">
      <label for="entry-algorithm">TOTP algorithm</label><select id="entry-algorithm" bind:value={edit.algorithm}
        ><option>SHA1</option><option>SHA256</option><option>SHA512</option></select>
    </div>
    <Status message={error} kind="error" /><Button type="submit" loading={pending}>Save encrypted entry</Button>
  </form></Dialog>
<Dialog open={!!deleteTarget} title="Delete vault account" onclose={() => (deleteTarget = null)}
  ><p>This removes {deleteTarget?.username} from this identity's vault.</p>
  <Status message={error} kind="error" />
  <div class="button-row delete-buttons">
    <Button variant="secondary" onclick={() => (deleteTarget = null)}>Cancel</Button><Button
      variant="danger"
      loading={pending}
      onclick={remove}>Delete account</Button>
  </div></Dialog>

<style>
  .vault-list {
    display: grid;
    gap: 12px;
  }
  .vault-entry {
    margin: 0 !important;
  }
  .vault-entry .section-heading {
    margin-bottom: 12px;
  }
  .vault-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
  }
  .vault-values > div {
    min-width: 0;
  }
  .delete-buttons {
    margin-top: 20px;
  }
  @media (max-width: 600px) {
    .vault-values {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }
</style>
