<script lang="ts">
  import {invalidateAll} from '$app/navigation';
  import {enhance} from '$app/forms';
  import {tick, untrack} from 'svelte';
  import type {SubmitFunction} from '@sveltejs/kit';
  import type {PageProps} from './$types';
  import Button from '$component/ui/Button.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import AuthenticatorSetup from '$component/ui/AuthenticatorSetup.svelte';
  import RecoveryCodes from '$component/ui/RecoveryCodes.svelte';
  import PaymentMethod from '$component/console/PaymentMethod.svelte';

  let {data, form}: PageProps = $props();
  let pending = $state('');
  let mode = $state('');
  let email = $state('');
  let totp = $state({secret: '', qr: '', step: 0});
  let recovery = $state<string[]>([]);
  let savedRecovery = $state(false);
  let key = $state('');
  let paymentID = $state('');
  let paymentForm = $state<HTMLFormElement>();
  let sessionsOpen = $state(false);
  let notice = $state<{message: string; kind: 'success' | 'error' | 'info'; context: string} | null>(
    untrack(() =>
      form?.message
        ? {message: form.message, kind: form.type === 'success' ? 'success' : 'error', context: 'page'}
        : null,
    ),
  );
  let paymentOpen = $state(false);
  let deleteOpen = $state(false);

  const submit: SubmitFunction<NonNullable<PageProps['form']>, NonNullable<PageProps['form']>> = ({formElement}) => {
    const action = formElement.dataset.action || 'action';
    const context = activeContext;

    pending = action;
    notice = null;

    return async ({update, result}) => {
      try {
        await update({reset: false});

        if (result.type !== 'success' && result.type !== 'failure') {
          return;
        }

        if (context !== 'page' && context !== activeContext) {
          return;
        }

        const response = result.data;

        if (!response || response.type === 'alert' || result.type === 'failure') {
          notice = {message: response?.message || 'Could not save this change. Try again.', kind: 'error', context};

          return;
        }

        applySettingsResponse(response, action);
      } finally {
        pending = '';
      }
    };
  };
  const settings = $derived(data.settings);
  const activeContext = $derived(
    mode || (paymentOpen ? 'payment' : deleteOpen ? 'delete' : sessionsOpen ? 'sessions' : 'page'),
  );

  function applySettingsResponse(response: NonNullable<PageProps['form']>, action: string) {
    if (response?.toggleModel) {
      mode = 'emailVerify';
    } else if (response?.toggleModel === false || action === 'username') {
      close();
    }

    if (response?.secret || response?.qr) {
      totp = {secret: response.secret || '', qr: response.qr || '', step: Number(response.step || 1)};
    }

    recovery = response?.recovery || [];
    savedRecovery = false;
    key = response?.key || '';

    if (key) {
      mode = 'api';
    }

    if (action === 'payment') {
      paymentOpen = false;
      paymentID = '';
    }

    const message =
      response?.message || (action === 'toggleApi' ? `API access ${settings.API ? 'enabled' : 'disabled'}.` : '');

    if (message) {
      notice = {message, kind: response?.type === 'info' ? 'info' : 'success', context: 'page'};
    }
  }

  function close() {
    mode = '';
    totp = {secret: '', qr: '', step: 0};
    key = '';
    recovery = [];
    savedRecovery = false;

    if (notice?.context !== 'page') {
      notice = null;
    }
  }

  $effect(() => {
    if (notice && notice.context !== 'page' && notice.context !== activeContext) {
      notice = null;
    }
  });
</script>

<svelte:head><title>Account settings | ShadowSelf</title></svelte:head>
<div class="page-heading">
  <div>
    <h1><Icon name="settings" size={24} />Account settings</h1>
  </div>
</div>
<Status
  message={notice?.context === 'page' ? notice.message : ''}
  kind={notice?.kind || 'info'}
  ondismiss={() => (notice = null)} />
<Status message={settings.type === 'alert' ? settings.message : ''} kind="error" />
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
        ><Button class="change-password" icon="key" iconPosition="end" onclick={() => (mode = 'password')}
          >Change password</Button>
      </div>
    </section>
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2><Icon name="code" size={20} />API access</h2>
        </div>
        <span class="badge {settings.API ? 'active' : 'disabled'}">{settings.API ? 'Enabled' : 'Disabled'}</span>
      </div>
      <dl class="data-list api-key-summary">
        <div>
          <dt>API key</dt>
          <dd>
            {#if settings.hasApiKey}<code>••••••••{settings.apiKeySuffix}</code>{:else}No key generated{/if}
          </dd>
        </div>
      </dl>
      <p>Keys are shown once. Regenerating a key revokes the previous one.</p>
      <div class="button-row settings-actions">
        <form method="POST" action="?/toggleApi" use:enhance={submit} data-action="toggleApi">
          <input type="hidden" name="enabled" value={String(!settings.API)} />
          <Button type="submit" variant="secondary" disabled={!!pending} loading={pending === 'toggleApi'}
            >{settings.API ? 'Disable API access' : 'Enable API access'}</Button>
        </form>
        {#if settings.hasApiKey}
          <Button variant="quiet" disabled={!settings.API || !!pending} onclick={() => (mode = 'api')}
            >Regenerate key</Button>
        {:else}
          <form method="POST" action="?/api" use:enhance={submit} data-action="api">
            <Button type="submit" variant="quiet" disabled={!settings.API || !!pending} loading={pending === 'api'}
              >Generate key</Button>
          </form>
        {/if}
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
          </form>{/if}<Button variant="quiet" disabled={!settings.OTP} onclick={() => (mode = 'recovery')}
          >Replace recovery codes</Button>
      </div>
    </section>
    <section class="panel billing-panel">
      <div class="section-heading">
        <div>
          <h2><Icon name="card" size={20} />Billing</h2>
        </div>
      </div>
      <p>Manage payment cards and identity subscriptions through Stripe.</p>
      <div class="button-row settings-actions">
        <Button variant="secondary" onclick={() => (paymentOpen = true)}>Add payment card</Button>
        <form method="POST" action="?/portal" use:enhance={submit} data-action="portal">
          <Button type="submit" variant="quiet" icon="external" loading={pending === 'portal'}
            >Open billing portal</Button>
        </form>
      </div>
    </section>
  </div>
  {#if settings.cryptoRefunds?.length}
    <section class="panel sessions-panel" aria-label="Crypto refunds">
      <h2><Icon name="wallet" size={20} />Crypto refunds</h2>
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
      <div class="refund-actions">
        <Button variant="secondary" onclick={() => invalidateAll()}>Refresh refund status</Button>
      </div>
    </section>
  {/if}
  {#if settings.refunds?.length}
    <section class="panel sessions-panel" aria-label="Card refunds">
      <h2><Icon name="card" size={20} />Card refunds</h2>
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
      <div class="refund-actions">
        <Button variant="secondary" onclick={() => invalidateAll()}>Refresh refund status</Button>
      </div>
    </section>
  {/if}
  <section class="panel sessions-panel active-sessions">
    <div class="section-heading">
      <div>
        <h2><Icon name="identities" size={20} />Active sessions</h2>
      </div>
    </div>
    {#if data.sessionsError}<Status message={data.sessionsError} kind="error" /><Button
        variant="secondary"
        onclick={() => invalidateAll()}>Retry loading sessions</Button
      >{:else if !data.sessions.length}<p>No active sessions.</p>{:else}<div class="sessions-list">
        {#each data.sessions as session (session.id)}<div>
            <span class="session-title"
              ><span>{session.current ? 'This browser' : 'Signed-in browser'}</span><code
                >({session.id.slice(0, 12)}…)</code
              ></span>
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
    <div class="sessions-footer">
      <p>End access on every browser, including this one.</p>
      <Button variant="danger" icon="logout" onclick={() => (sessionsOpen = true)}>Sign out all sessions</Button>
    </div>
  </section>
  <section class="panel danger-panel">
    <div>
      <h2><Icon name="trash" size={20} />Delete account</h2>
      <p>Delete the account and its identities. Move funds out of wallets and virtual cards first.</p>
    </div>
    <Button variant="danger" icon="trash" onclick={() => (deleteOpen = true)}>Delete account</Button>
  </section>
  <Dialog
    open={!!mode}
    title={mode === 'totp'
      ? 'Set up authenticator'
      : mode === 'emailVerify'
        ? 'Verify new email'
        : mode === 'deleteOtp'
          ? 'Disable authenticator'
          : mode === 'api'
            ? key
              ? 'New API key'
              : 'Regenerate API key?'
            : mode === 'recovery'
              ? 'Replace recovery codes'
              : `Change ${mode}`}
    onclose={close}>
    <Status message={notice?.context === mode ? notice.message : ''} kind="error" />
    {#if key}<Status message="Store this key now. It will not be shown again."
        >Store this key now. <strong>It will not be shown again.</strong></Status
      ><Copy value={key} label="Copy API key" stacked>
        {#snippet actions()}<Button onclick={close}>Done</Button>{/snippet}
      </Copy>{:else if recovery.length}<Status
        message="The previous recovery codes no longer work. Save these replacement codes now." />
      <RecoveryCodes codes={recovery} />
      <div class="recovery-confirmation">
        <label>
          <input type="checkbox" bind:checked={savedRecovery} />
          <span>I saved these recovery codes.</span>
        </label>
        <Button disabled={!savedRecovery} onclick={close}>Done</Button>
      </div>
    {:else if mode === 'api'}
      <p>
        This revokes the key ending in <code>{settings.apiKeySuffix}</code>. Update any apps or scripts that use it.
      </p>
      <form method="POST" action="?/api" use:enhance={submit} data-action="api">
        <div class="dialog-actions">
          <Button variant="secondary" onclick={close}>Cancel</Button>
          <Button type="submit" loading={pending === 'api'}>Regenerate key</Button>
        </div>
      </form>
    {:else if mode === 'totp'}{#if totp.qr}<AuthenticatorSetup qr={totp.qr} secret={totp.secret} />
        <form method="POST" action="?/checkOtp" use:enhance={submit} data-action="checkOtp">
          <input type="hidden" name="secret" value={totp.secret} />
          <div class="field">
            <label for="settings-token">Authenticator code</label><input
              id="settings-token"
              placeholder="000000"
              name="token"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern={'[0-9]{6}'}
              oninput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\s/g, '');
              }}
              required />
          </div>
          <div class="field">
            <label for="totp-password">Password</label><input
              id="totp-password"
              placeholder="Your password"
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
              pattern={'[0-9]{8}'}
              oninput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\s/g, '');
              }}
              required />
          </div>{/if}{#if mode === 'password'}<Status
            message="Changing your password signs out all sessions and revokes the API key." />
          <div class="field">
            <label for="settings-new-password">New password</label><input
              id="settings-new-password"
              placeholder="Correct Horse Battery Staple"
              name="password"
              type="password"
              minlength="12"
              autocomplete="new-password"
              required />
          </div>{/if}{#if mode === 'deleteOtp'}<p>
            This removes the authenticator requirement from future sign-ins.
          </p>{/if}
        {#if ['email', 'emailVerify', 'password', 'deleteOtp', 'recovery'].includes(mode)}
          <div class="field settings-password">
            <label for="settings-current-password">Current password</label><input
              id="settings-current-password"
              placeholder="Your password"
              name={mode === 'recovery' ? 'password' : 'currentPassword'}
              type="password"
              autocomplete="current-password"
              required />
          </div>
        {/if}
        <Button type="submit" loading={pending === mode}
          >{mode === 'recovery'
            ? 'Generate replacement codes'
            : mode === 'email'
              ? 'Send verification code'
              : 'Confirm change'}</Button>
      </form>{/if}
  </Dialog>
  <Dialog bind:open={paymentOpen} title="Add payment card">
    {#if paymentOpen}
      <PaymentMethod
        stripeKey={data.stripeKey}
        onready={async (id) => {
          paymentID = id;
          await tick();
          paymentForm?.requestSubmit();
        }} />
      <form bind:this={paymentForm} method="POST" action="?/payment" use:enhance={submit} data-action="payment">
        <input type="hidden" name="setupIntent" value={paymentID} />
        <Status message={notice?.context === 'payment' ? notice.message : ''} kind="error" />
        {#if pending === 'payment'}<Status
            message="Saving your payment card…" />{:else if paymentID && notice?.context === 'payment'}<Button
            type="submit">Retry saving payment card</Button
          >{/if}
      </form>
    {/if}
  </Dialog>
  <Dialog bind:open={sessionsOpen} title="Sign out all devices">
    <p>This ends every active session, including this browser. Sign in again to access your account.</p>
    <Status message={notice?.context === 'sessions' ? notice.message : ''} kind="error" />
    <form method="POST" action="?/session" use:enhance={submit} data-action="sessions">
      <input type="hidden" name="revoke" value="true" />
      <div class="dialog-actions">
        <Button variant="secondary" onclick={() => (sessionsOpen = false)}>Cancel</Button>
        <Button type="submit" variant="danger" icon="logout" loading={pending === 'sessions'}
          >Sign out all devices</Button>
      </div>
    </form>
  </Dialog>
  <Dialog bind:open={deleteOpen} title="Delete your account"
    ><div class="deletion-details">
      <p>
        This permanently deletes your account, identities, vaults and messages. Move funds out of all wallets and
        virtual cards before continuing. Deletion removes access to them.
      </p>
      <p>
        Subscriptions are cancelled automatically. Eligible fiat purchases are refunded to the original payment card
        through Stripe.
      </p>
      <p>
        Eligible initial crypto purchases can be refunded in XMR at their original USD value, converted when the payout
        is signed. ShadowSelf pays the outgoing network fee.
      </p>
    </div>
    <form method="POST" action="?/delete" use:enhance={submit} data-action="delete">
      <details class="refund-address">
        <summary>Monero refund address <span>Optional</span><Icon name="chevron" size={16} /></summary>
        <div class="field">
          <label class="sr-only" for="account-refund-address">External Monero address</label>
          <input
            id="account-refund-address"
            placeholder="Your external Monero address"
            name="refundAddress"
            autocomplete="off"
            spellcheck="false"
            maxlength="106" />
          <small>Use a mainnet XMR address you control outside this account.</small>
        </div>
      </details>
      <p class="refund-note">
        An address is only needed to receive a crypto refund. You can delete your account without requesting one.
      </p>
      <div class="field settings-password">
        <label for="account-delete-password">Password</label><input
          id="account-delete-password"
          placeholder="Your password"
          name="currentPassword"
          type="password"
          autocomplete="current-password"
          required />
      </div>
      <Status message={notice?.context === 'delete' ? notice.message : ''} kind="error" /><Button
        type="submit"
        variant="danger"
        loading={pending === 'delete'}>Delete account and identities</Button>
    </form></Dialog>
{/if}

<style>
  :global(.change-password svg[data-icon='key']) {
    fill: currentColor;
    stroke: none;
  }

  .recovery-confirmation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .recovery-confirmation label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    cursor: pointer;
  }
  .recovery-confirmation :global(button) {
    flex-shrink: 0;
  }

  .api-key-summary {
    margin-bottom: 16px;
  }
  .api-key-summary code {
    font: inherit;
    white-space: nowrap;
  }

  .dialog-actions,
  .refund-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
  }
  .deletion-details {
    display: grid;
    gap: 14px;
    margin-bottom: 24px;
  }
  .deletion-details p {
    margin: 0;
  }
  .refund-address {
    padding: 14px;
    border: 1px solid color-mix(in srgb, var(--accent-light) 18.82%, transparent);
    border-radius: 5px;
  }
  .refund-address summary {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    list-style: none;
    font-size: 13px;
  }
  .refund-address summary::-webkit-details-marker {
    display: none;
  }
  .refund-address summary span {
    margin-left: auto;
    color: var(--muted);
    font-size: 11px;
  }
  .refund-address[open] summary :global(svg) {
    transform: rotate(180deg);
  }
  .refund-address .field {
    margin-top: 16px;
    margin-bottom: 0;
  }
  .refund-note {
    margin-top: 12px;
    font-size: 12px;
  }
  .billing-panel {
    --feature-card: var(--accent);
  }
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
  h2 :global(svg[data-icon='card']) {
    color: var(--accent);
  }
  .danger-panel h2 {
    margin-bottom: 12px;
  }
  .danger-panel h2 :global(svg) {
    color: var(--danger-color);
  }
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .settings-grid > .panel {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
  .settings-actions {
    margin-top: auto;
    padding-top: 22px;
  }
  .sessions-panel {
    margin-top: 18px;
  }
  .sessions-panel > h2 {
    margin-bottom: 12px;
  }
  .sessions-panel > p {
    margin-bottom: 18px;
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
    margin-bottom: 8px;
  }
  .active-sessions .sessions-list > div:first-child {
    border-top: 0;
  }
  .active-sessions .sessions-list > div {
    min-height: 48px;
    padding: 4px 0;
  }
  .active-sessions .session-title {
    min-width: 0;
    padding-left: 8px;
  }
  .active-sessions .sessions-list form {
    margin: 0;
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
  .sessions-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .sessions-footer p {
    margin: 0;
    padding-left: 8px;
    font-size: 12px;
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
    border-color: color-mix(in srgb, var(--danger-color) 20%, transparent);
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
      color: var(--danger-color);
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
    .sessions-list:not(.refund-list) > div {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
    }
    .active-sessions .session-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .sessions-list:not(.refund-list) > div > form {
      justify-self: end;
    }
  }
</style>
