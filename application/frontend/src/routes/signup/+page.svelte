<script lang="ts">
  import {enhance} from '$app/forms';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import type {PageProps} from './$types';

  let {data, form}: PageProps = $props();
  let pending = $state(false);
  let savedRecovery = $state(false);
  const registration = $derived(form?.registration || data.registration);
  const titles = {
    account: 'Create your account',
    email: 'Verify your email',
    authenticator: 'Verify your authenticator',
    recovery: 'Save your recovery codes',
    complete: 'Complete account creation',
  };
  const actions = {account: 'init', email: 'verifyEmail', authenticator: 'verifyAuthenticator', recovery: 'create', complete: 'create'};

  function submit() {
    pending = true;

    return async ({update}: {update: (options: {reset: boolean}) => Promise<void>}) => {
      try {
        await update({reset: false});
      } finally {
        pending = false;
      }
    };
  }
</script>

<svelte:head>
  <title>Create an account | ShadowSelf</title>
  <meta name="description" content="Create a ShadowSelf account with email verification and optional two-factor authentication." />
</svelte:head>
<div class="access">
  <section class="panel">
    <h1>{titles[registration.stage]}</h1>
    <Status message={form?.message || data.message || ''} kind="error" />
    <form method="POST" action="?/{actions[registration.stage]}" use:enhance={submit}>
      {#if registration.stage === 'account'}
        <div class="field">
          <label for="signup-email">Email address</label>
          <input id="signup-email" type="email" name="email" autocomplete="email" maxlength="48" required />
        </div>
        <div class="field">
          <label for="signup-username">Username</label>
          <input id="signup-username" name="username" autocomplete="nickname" minlength="1" maxlength="25" required />
        </div>
        <div class="field">
          <label for="signup-password">Account password</label>
          <input id="signup-password" name="password" type="password" minlength="12" maxlength="256" autocomplete="new-password" required />
          <small>Minimum 12 characters.</small>
        </div>
        <label class="security-copy recovery-confirm">
          <input type="checkbox" name="enableTwoFactor" checked /> Enable two-factor authentication
        </label>
      {:else if registration.stage === 'email'}
        <p>Code sent to {registration.email}.</p>
        <div class="field">
          <label for="signup-code">Email code</label>
          <input id="signup-code" name="access" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" autocomplete="one-time-code" required />
        </div>
      {:else if registration.stage === 'authenticator'}
        <img class="qr-image" src={registration.qr} alt="Authenticator enrollment QR code" />
        <Copy value={registration.secret} label="Copy secret" />
        <p class="security-copy">Scan the QR code or enter this secret in your authenticator.</p>
        <div class="field">
          <label for="signup-totp">Authenticator code</label>
          <input id="signup-totp" name="token" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required />
        </div>
      {:else if registration.stage === 'recovery'}
        <p>Each code restores access if you lose your authenticator and can be used once.</p>
        <div class="recovery-codes">
          {#each registration.recovery as code (code)}<span>{code}</span>{/each}
        </div>
        <Copy value={registration.recovery.join('\n')} label="Copy codes" />
        <label class="security-copy recovery-confirm">
          <input type="checkbox" name="savedRecovery" bind:checked={savedRecovery} required /> I saved these recovery codes.
        </label>
      {:else}
        <p>Your email is verified. Retry creating the account.</p>
      {/if}
      <Button type="submit" loading={pending} disabled={registration.stage === 'recovery' && !savedRecovery} icon="arrow">
        {registration.stage === 'account'
          ? 'Create account'
          : registration.stage === 'recovery' || registration.stage === 'complete'
            ? 'Finish account creation'
            : 'Verify'}
      </Button>
    </form>
    {#if registration.stage === 'account'}
      <div class="access-links"><a href="/login">Sign in</a></div>
    {:else}
      <form method="POST" action="?/restart" use:enhance={submit} class="access-links">
        <button type="submit" disabled={pending}>Start again</button>
      </form>
    {/if}
  </section>
</div>

<style>
  .security-copy {
    margin: 18px 0 !important;
  }
  .recovery-confirm {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .recovery-confirm input {
    margin: 0;
    flex-shrink: 0;
  }
</style>
