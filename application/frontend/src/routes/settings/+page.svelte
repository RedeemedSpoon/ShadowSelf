<script lang="ts">
  import {invalidateAll} from '$app/navigation';
  import {enhance} from '$app/forms';
  import type {SubmitFunction} from '@sveltejs/kit';
  import type {PageProps} from './$types';
  import Button from '$component/ui/Button.svelte';
  import Icon from '$component/ui/Icon.svelte';
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
    <h1><Icon name="settings" size={24} />Account settings</h1>
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
          <h2><Icon name="user" size={20} />Account details</h2>
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
          <h2><Icon name="shield" size={20} />Sign-in security</h2>
        </div>
        <span class="badge {settings.OTP ? 'active' : 'disabled'}">{settings.OTP ? '2FA enabled' : '2FA off'}</span>
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
          <h2><Icon name="code" size={20} />API access</h2>
        </div>
        <span class="badge {settings.API ? 'active' : 'disabled'}">{settings.API ? 'Enabled' : 'Disabled'}</span>
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
          <h2><Icon name="card" size={20} />Billing</h2>
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
  {#if settings.cryptoRefunds?.length}
    <section class="panel sessions-panel" aria-label="Crypto refunds">
      <h2><Icon name="refresh" size={20} />Crypto refunds</h2>
      <p>
        Eligible refunds are paid in XMR using the original USD purchase value. The exchange rate is fixed when the
        payout is signed. ShadowSelf pays the outgoing fee.
      </p>
      <div class="sessions-list refund-list">
        {#each settings.cryptoRefunds as refund (refund.id)}
          <div>
            <div class="session-title">
              Requested {new Date(refund.requestedAt).toLocaleDateString()}
              <code>{refund.id}</code>
            </div>
            {#if refund.xmrAmount}
              <p>{refund.xmrAmount} XMR · Awaiting network confirmation. Retries use the same signed payout.</p>
            {:else}
              <p>
                Queued. Waiting for a current exchange rate and available wallet funds. Processing retries
                automatically.
              </p>
            {/if}
          </div>
        {/each}
      </div>
      <Button variant="secondary" onclick={() => invalidateAll()}>Refresh refund status</Button>
    </section>
  {/if}
  {#if settings.refunds?.length}
    <section class="panel sessions-panel" aria-label="Card refunds">
      <h2>Card refunds</h2>
      <p>These refunds continue after identity deletion. Completed refunds no longer appear here.</p>
      <div class="sessions-list refund-list">
        {#each settings.refunds as refund (refund.id)}
          <div>
            <span class="session-title">
              Requested {new Date(refund.requestedAt).toLocaleDateString()}
              <code>{refund.id}</code>
            </span>
            {#if ['refund_failed', 'billing_reference_missing', 'billing_reference_mismatch', 'billing_reference_ambiguous', 'provider_rejected'].includes(refund.errorCode)}
              <p>Needs attention. <a href="/contact">Contact support</a> with this reference.</p>
            {:else if refund.errorCode === 'refund_requires_action'}
              <p>Action required. Check Stripe's refund email or <a href="/contact">contact support</a>.</p>
            {:else if refund.errorCode === 'payment_disputed'}
              <p>Waiting for the payment dispute to be resolved.</p>
            {:else}
              <p>Processing. No further deletion request is needed.</p>
            {/if}
          </div>
        {/each}
      </div>
      <Button variant="secondary" onclick={() => invalidateAll()}>Refresh refund status</Button>
    </section>
  {/if}
  <section class="panel sessions-panel active-sessions">
    <div class="section-heading">
      <div>
        <h2><Icon name="identities" size={20} />Active sessions</h2>
      </div>
      <form class="sign-out-sessions" method="POST" action="?/session" use:enhance={submit} data-action="sessions">
        <input type="hidden" name="revoke" value="true" /><Button
          type="submit"
          variant="quiet"
          class="revoke-all"
          loading={pending === 'sessions'}>Sign out all sessions</Button>
      </form>
    </div>
    {#if data.sessionsError}<Status message={data.sessionsError} kind="error" /><Button
        variant="secondary"
        onclick={() => invalidateAll()}>Retry loading sessions</Button
      >{:else if !data.sessions.length}<p>No active sessions.</p>{:else}<div class="sessions-list">
        {#each data.sessions as session (session.id)}<div>
            <span class="session-title"
              >{session.current ? 'This browser' : 'Signed-in browser'}<code>({session.id.slice(0, 12)}…)</code></span>
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
  </section>
  <section class="panel danger-panel">
    <div>
      <h2><Icon name="trash" size={20} />Delete account</h2>
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
              placeholder="000000"
              name="token"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern="[0-9]{6}"
              required />
          </div>
          <div class="field">
            <label for="totp-password">Account password</label><input
              id="totp-password"
              placeholder="Your account passphrase"
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
              placeholder="ghost_in_the_machine"
              name="username"
              value={settings.username}
              required
              maxlength="32" />
          </div>{/if}{#if mode === 'email'}<div class="field">
            <label for="settings-email">New email address</label><input
              id="settings-email"
              placeholder="you@example.com"
              name="email"
              type="email"
              maxlength="254"
              bind:value={email}
              required />
          </div>{/if}{#if mode === 'emailVerify'}<input type="hidden" name="email" value={email} />
          <div class="field">
            <label for="settings-email-code">Code sent to {email}</label><input
              id="settings-email-code"
              placeholder="00000000"
              name="access"
              inputmode="numeric"
              pattern="[0-9]{8}"
              required />
          </div>{/if}{#if mode === 'password'}<Status
            message="Changing the account password signs out all sessions and revokes the API key." />
          <div class="field">
            <label for="settings-new-password">New account password</label><input
              id="settings-new-password"
              placeholder="Correct Horse Battery Staple"
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
            placeholder="Your account passphrase"
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
          placeholder="Your account passphrase"
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
      This deletes your account and identities. Subscription cancellation and eligible refunds continue automatically
      after deletion. Move any wallet funds first.
    </p>
    <form method="POST" action="?/delete" use:enhance={submit} data-action="delete">
      {#if settings.cryptoRefundRequired}
        <p>
          Eligible initial crypto purchases will be refunded in XMR at their original USD value, converted when each
          payout is signed. ShadowSelf pays the outgoing network fee.
        </p>
        <div class="field">
          <label for="account-refund-address">Monero refund address</label>
          <input
            id="account-refund-address"
            placeholder="Your external Monero address"
            name="refundAddress"
            autocomplete="off"
            spellcheck="false"
            maxlength="106"
            required />
          <small
            >Use a mainnet XMR address you control outside this account. Refunds continue after account deletion.</small>
        </div>
      {/if}
      <div class="field settings-password">
        <label for="account-delete-password">Account password</label><input
          id="account-delete-password"
          placeholder="Your account passphrase"
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
  h1,
  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h1 :global(svg),
  h2 :global(svg) {
    flex-shrink: 0;
    color: var(--accent);
  }
  .danger-panel h2 {
    margin-bottom: 12px;
  }
  .danger-panel h2 :global(svg) {
    color: #f6a8b2;
  }
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
    border-top: 1px solid color-mix(in srgb, var(--accent-light) 12.55%, transparent);
  }
  .active-sessions .section-heading {
    margin-bottom: 12px;
  }
  .active-sessions .sessions-list > div:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .active-sessions .sessions-list > div:last-child {
    padding-bottom: 0;
  }
  .refund-list > div {
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .refund-list .session-title {
    flex: 1 0 220px;
  }
  .refund-list p {
    flex: 1 1 240px;
    margin: 0;
    font-size: 12px;
  }
  .session-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .sign-out-sessions {
    display: flex;
    justify-content: flex-end;
    margin: 0;
  }
  .sign-out-sessions :global(.revoke-all) {
    color: #f08b9b;
  }
  .sign-out-sessions :global(.revoke-all:hover) {
    color: #ffacba;
    background: #fb718512;
  }
  .session-title code {
    color: #71839f;
    font-size: 10px;
    white-space: nowrap;
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
    h1,
    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h1 :global(svg),
    h2 :global(svg) {
      flex-shrink: 0;
      color: var(--accent);
    }
    .danger-panel h2 :global(svg) {
      color: #f6a8b2;
    }
    .settings-grid {
      grid-template-columns: 1fr;
    }
    .danger-panel {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 600px) {
    .active-sessions .section-heading {
      flex-wrap: nowrap;
      gap: 8px;
    }
    .active-sessions h2 {
      gap: 6px;
      font-size: 15px;
      white-space: nowrap;
    }
    .sign-out-sessions :global(.revoke-all) {
      padding: 8px 0;
      font-size: 10px;
      white-space: nowrap;
    }
    .sessions-list:not(.refund-list) > div {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
    .sessions-list:not(.refund-list) > div > form {
      justify-self: end;
    }
  }
</style>
