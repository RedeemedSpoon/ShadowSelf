<script lang="ts">
  import {invalidateAll} from '$app/navigation';
  import {enhance} from '$app/forms';
  import type {SubmitFunction} from '@sveltejs/kit';
  import type {PageProps} from './$types';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import PaymentMethod from '$component/console/PaymentMethod.svelte';

  let {data, form}: PageProps = $props();
  let pending = $state('');
  let mode = $state('');
  let email = $state('');
  let totp = $state({secret: '', qr: '', step: 0});
  let recovery = $state<string[]>([]);
  let key = $state('');
  let paymentID = $state('');
  let paymentOpen = $state(false);
  let deleteOpen = $state(false);

  $effect(() => {
    if (!form) {
      return;
    }

    if (form.toggleModel) {
      mode = 'emailVerify';
    }

    if (form.toggleModel === false) {
      mode = '';
    }

    if (form.secret || form.qr) {
      totp = {secret: form.secret || totp.secret, qr: form.qr || totp.qr, step: Number(form.step || 1)};
    }

    if (form.recovery) {
      recovery = form.recovery;
    }

    if (form.key) {
      key = form.key;
    }

    if (form.sessionUrl && pending === 'portal') {
      window.location.assign(form.sessionUrl);
    }
  });

  const submit: SubmitFunction = ({formElement}) => {
    pending = formElement.dataset.action || 'action';

    return async ({update, result}) => {
      try {
        if (result.type === 'success' && result.data?.sessionUrl && pending === 'portal') {
          window.location.assign(result.data.sessionUrl);
        }

        await update({reset: false});
      } finally {
        pending = '';
      }
    };
  };
  const settings = $derived(data.settings);

  function close() {
    mode = '';
    totp = {secret: '', qr: '', step: 0};
    key = '';
    recovery = [];
  }
</script>

<svelte:head><title>Account settings | ShadowSelf</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Account settings</h1>
  </div>
</div>
<Status message={form?.message || ''} kind={form?.type === 'success' ? 'success' : 'error'} /><Status
  message={settings.type === 'alert' ? settings.message : ''}
  kind="error" />
{#if settings.type === 'alert'}<Button variant="secondary" onclick={() => invalidateAll()}
    >Retry loading settings</Button
  >{:else}
  <div class="settings-grid">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Account details</h2>
        </div>
      </div>
      <dl class="data-list">
        <div>
          <dt>Username</dt>
          <dd>{settings.username}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{settings.email}</dd>
        </div>
      </dl>
      <div class="button-row settings-actions">
        <Button variant="secondary" onclick={() => (mode = 'username')}>Change username</Button><Button
          variant="secondary"
          onclick={() => {
            email = settings.email || '';
            mode = 'email';
          }}>Change email</Button
        ><Button variant="quiet" icon="key" onclick={() => (mode = 'password')}>Change password</Button>
      </div>
    </section>
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Sign-in security</h2>
        </div>
        <span class="badge {settings.OTP ? 'active' : ''}">{settings.OTP ? '2FA enabled' : '2FA off'}</span>
      </div>
      <p>{settings.recoveryRemaining ?? 0} recovery codes remain. Each code is valid once.</p>
      <div class="button-row settings-actions">
        {#if settings.OTP}<Button variant="secondary" onclick={() => (mode = 'deleteOtp')}>Disable authenticator</Button
          >{:else}<form action="?/generateOtp" method="POST" use:enhance={submit} data-action="generateOtp">
            <Button
              variant="secondary"
              loading={pending === 'generateOtp'}
              type="submit"
              onclick={() => (mode = 'totp')}>Set up authenticator</Button>
          </form>{/if}<Button variant="quiet" onclick={() => (mode = 'recovery')}>Replace recovery codes</Button>
      </div>
    </section>
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>API access</h2>
        </div>
        <span class="badge {settings.API ? 'active' : ''}">{settings.API ? 'Enabled' : 'Disabled'}</span>
      </div>
      <p>New API keys are shown once. Generating a key replaces the existing one.</p>
      <div class="button-row settings-actions">
        <Button variant="secondary" onclick={() => (mode = 'toggleApi')}
          >{settings.API ? 'Disable API access' : 'Enable API access'}</Button
        ><Button variant="quiet" disabled={!settings.API} onclick={() => (mode = 'api')}>Generate new key</Button>
      </div>
    </section>
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Billing</h2>
        </div>
      </div>
      <p>Identity subscriptions use Stripe.</p>
      <div class="button-row settings-actions">
        <Button variant="secondary" icon="card" onclick={() => (paymentOpen = true)}>Add payment card</Button><Button
          variant="quiet"
          onclick={() => (mode = 'portal')}>Open billing portal</Button>
      </div>
    </section>
  </div>
  <section class="panel sessions-panel">
    <div class="section-heading">
      <div>
        <h2>Active sessions</h2>
      </div>
    </div>
    {#if data.sessionsError}<Status message={data.sessionsError} kind="error" /><Button
        variant="secondary"
        onclick={() => invalidateAll()}>Retry loading sessions</Button
      >{:else if !data.sessions.length}<p>No active sessions.</p>{:else}<div class="sessions-list">
        {#each data.sessions as session (session.id)}<div>
            <span class="session-title"
              >{session.current ? 'This browser' : 'Signed-in browser'}<code>{session.id.slice(0, 12)}…</code></span>
            <form method="POST" action="?/revokeSession" use:enhance={submit} data-action={session.id}>
              <input type="hidden" name="id" value={session.id} /><input
                type="hidden"
                name="current"
                value={String(session.current)} /><Button
                type="submit"
                variant="secondary"
                loading={pending === session.id}>Revoke session</Button>
            </form>
          </div>{/each}
      </div>{/if}
    <form method="POST" action="?/session" use:enhance={submit} data-action="sessions">
      <input type="hidden" name="revoke" value="true" /><Button
        type="submit"
        variant="quiet"
        loading={pending === 'sessions'}>Sign out all sessions</Button>
    </form>
  </section>
  <section class="panel danger-panel">
    <div>
      <h2>Delete account</h2>
      <p>Delete the account and its identities. Move wallet funds first.</p>
    </div>
    <Button variant="danger" icon="trash" onclick={() => (deleteOpen = true)}>Delete account</Button>
  </section>
  <Dialog
    open={!!mode}
    title={mode === 'totp'
      ? 'Set up authenticator'
      : mode === 'emailVerify'
        ? 'Verify new email'
        : mode === 'toggleApi'
          ? 'Change API access'
          : mode === 'deleteOtp'
            ? 'Disable authenticator'
            : mode === 'portal'
              ? 'Open billing portal'
              : mode === 'api'
                ? 'Generate API key'
                : mode === 'recovery'
                  ? 'Replace recovery codes'
                  : `Change ${mode}`}
    onclose={close}>
    {#if key}<Status message="Store this key now. It will not be shown again." /><Copy
        value={key}
        label="Copy API key" />{:else if recovery.length}<Status
        message="The previous recovery codes no longer work. Save these replacement codes now." />
      <div class="recovery-codes">
        {#each recovery as code (code)}<span>{code}</span>{/each}
      </div>
      <Copy value={recovery.join('\n')} label="Copy codes" />
    {:else if mode === 'totp'}{#if totp.qr}<img
          class="qr-image"
          src={totp.qr}
          alt="Authenticator enrollment QR code" /><Copy value={totp.secret} label="Copy secret" />
        <form method="POST" action="?/checkOtp" use:enhance={submit} data-action="checkOtp">
          <input type="hidden" name="secret" value={totp.secret} />
          <div class="field">
            <label for="settings-token">Authenticator code</label><input
              id="settings-token"
              name="token"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern="[0-9]{6}"
              required />
          </div>
          <div class="field">
            <label for="totp-password">Account password</label><input
              id="totp-password"
              name="currentPassword"
              type="password"
              autocomplete="current-password"
              required />
          </div>
          <Button type="submit" loading={pending === 'checkOtp'}>Enable authenticator</Button>
        </form>{:else}<Status message="Request an enrollment code to connect your authenticator." />
        <form method="POST" action="?/generateOtp" use:enhance={submit} data-action="generateOtp">
          <Button type="submit" loading={pending === 'generateOtp'}>Load enrollment code</Button>
        </form>{/if}
    {:else}<form
        method="POST"
        action="?/{mode === 'emailVerify' ? 'access' : mode}"
        use:enhance={submit}
        data-action={mode}>
        {#if mode === 'username'}<div class="field">
            <label for="settings-username">New username</label><input
              id="settings-username"
              name="username"
              value={settings.username}
              required
              maxlength="32" />
          </div>{/if}{#if mode === 'email'}<div class="field">
            <label for="settings-email">New email address</label><input
              id="settings-email"
              name="email"
              type="email"
              maxlength="254"
              bind:value={email}
              required />
          </div>{/if}{#if mode === 'emailVerify'}<input type="hidden" name="email" value={email} />
          <div class="field">
            <label for="settings-email-code">Code sent to {email}</label><input
              id="settings-email-code"
              name="access"
              inputmode="numeric"
              pattern="[0-9]{8}"
              required />
          </div>{/if}{#if mode === 'password'}<Status
            message="Changing the account password signs out all sessions and revokes the API key." />
          <div class="field">
            <label for="settings-new-password">New account password</label><input
              id="settings-new-password"
              name="password"
              type="password"
              minlength="12"
              autocomplete="new-password"
              required />
          </div>{/if}{#if mode === 'toggleApi'}<input
            type="hidden"
            name="enabled"
            value={String(!settings.API)} />{/if}{#if mode === 'deleteOtp'}<p>
            This removes the authenticator requirement from future sign-ins.
          </p>{/if}
        <div class="field settings-password">
          <label for="settings-current-password">Current account password</label><input
            id="settings-current-password"
            name={mode === 'recovery' ? 'password' : 'currentPassword'}
            type="password"
            autocomplete="current-password"
            required />
        </div>
        <Status message={form?.message || ''} kind="error" /><Button type="submit" loading={pending === mode}
          >{mode === 'portal'
            ? 'Open Stripe portal'
            : mode === 'api'
              ? 'Generate key'
              : mode === 'recovery'
                ? 'Generate replacement codes'
                : mode === 'email'
                  ? 'Send verification code'
                  : 'Confirm change'}</Button>
      </form>{/if}
  </Dialog>
  <Dialog bind:open={paymentOpen} title="Add payment card"
    ><PaymentMethod stripeKey={data.stripeKey} onready={(id) => (paymentID = id)} />
    <form method="POST" action="?/payment" use:enhance={submit} data-action="payment">
      <input type="hidden" name="paymentID" value={paymentID} />
      <div class="field">
        <label for="payment-password">Account password</label><input
          id="payment-password"
          name="currentPassword"
          type="password"
          autocomplete="current-password"
          required />
      </div>
      <Status message={form?.message || ''} kind="error" /><Button
        type="submit"
        disabled={!paymentID}
        loading={pending === 'payment'}>Save payment method</Button>
    </form></Dialog>
  <Dialog bind:open={deleteOpen} title="Delete your account"
    ><p>
      This cancels subscriptions and deletes your account and identities. Move any wallet funds first. If billing
      cleanup fails, retry the deletion.
    </p>
    <form method="POST" action="?/delete" use:enhance={submit} data-action="delete">
      <div class="field settings-password">
        <label for="account-delete-password">Account password</label><input
          id="account-delete-password"
          name="currentPassword"
          type="password"
          autocomplete="current-password"
          required />
      </div>
      <Status message={form?.message || ''} kind="error" /><Button
        type="submit"
        variant="danger"
        loading={pending === 'delete'}>Delete account and identities</Button>
    </form></Dialog>
{/if}

<style>
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .settings-grid > .panel {
    margin: 0;
  }
  .settings-actions {
    margin-top: 22px;
  }
  .sessions-panel {
    margin-top: 18px;
  }
  .sessions-list > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 15px 0;
    border-top: 1px solid #a5b4fc20;
  }
  .session-title {
    font-size: 12px;
  }
  .session-title code {
    display: block;
    color: #71839f;
    font-size: 10px;
    margin-top: 5px;
  }
  .danger-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    margin-top: 25px;
    border-color: #e6829128;
  }
  .settings-password {
    margin-top: 20px;
  }
  @media (max-width: 950px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
    .danger-panel {
      flex-wrap: wrap;
    }
  }
</style>
