<script lang="ts">
  import {untrack} from 'svelte';
  import {enhance} from '$app/forms';
  import Icon from '$component/ui/Icon.svelte';
  import AuthCard from '$component/ui/AuthCard.svelte';
  import AccountConstellation from '$component/ui/AccountConstellation.svelte';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import AuthenticatorSetup from '$component/ui/AuthenticatorSetup.svelte';
  import RecoveryCodes from '$component/ui/RecoveryCodes.svelte';
  import type {PageProps} from './$types';

  let {data, form}: PageProps = $props();
  let pending = $state(false);
  let savedRecovery = $state(false);
  let email = $state(untrack(() => data.registration.email));
  let password = $state('');
  const registration = $derived(form?.registration || data.registration);
  $effect(() => {
    if (registration.stage !== 'recovery') {
      savedRecovery = false;
    }
  });

  const titles = {
    account: 'Create your account',
    email: 'Verify your email',
    username: 'Choose your username',
    security: 'Enable two-factor authentication?',
    authenticator: 'Verify your authenticator',
    recovery: 'Save your recovery codes',
    complete: 'Complete account creation',
  };
  const actions = {
    account: 'init',
    email: 'verifyEmail',
    username: 'setUsername',
    security: 'chooseSecurity',
    authenticator: 'verifyAuthenticator',
    recovery: 'saveRecovery',
    complete: 'create',
  };

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
  <meta
    name="description"
    content="Create a ShadowSelf account with email verification and optional two-factor authentication." />
</svelte:head>
<div class="access">
  <AuthCard stage={registration.stage}>
    {#if registration.stage === 'complete'}
      <AccountConstellation />
    {/if}
    <h1>{titles[registration.stage]}</h1>
    <Status message={form?.message || data.message || ''} kind="error" />
    <form method="POST" action="?/{actions[registration.stage]}" use:enhance={submit}>
      {#if registration.stage === 'account'}
        <div class="field">
          <label for="signup-email">Email address</label>
          <input
            id="signup-email"
            bind:value={email}
            placeholder="you@example.com"
            type="email"
            name="email"
            autocomplete="email"
            maxlength="254"
            required />
        </div>
        <div class="field">
          <label for="signup-password">Account password</label>
          <input
            id="signup-password"
            bind:value={password}
            placeholder="Correct Horse Battery Staple"
            name="password"
            type="password"
            minlength="12"
            maxlength="256"
            autocomplete="new-password"
            required />
          <small>Minimum 12 characters.</small>
        </div>
      {:else if registration.stage === 'email'}
        <p>
          {registration.verified
            ? `Your email address ${registration.email} is verified.`
            : `Code sent to ${registration.email}.`}
        </p>
        {#if !registration.verified}
          <div class="field">
            <label for="signup-code">Email code</label>
            <input
              id="signup-code"
              placeholder="00000000"
              name="access"
              inputmode="numeric"
              pattern={'[0-9]{8}'}
              oninput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\s/g, '');
              }}
              maxlength="32"
              autocomplete="one-time-code"
              required />
          </div>
        {/if}
      {:else if registration.stage === 'username'}
        <p>Choose a name for your account. You can change it later.</p>
        <div class="field">
          <label for="signup-username">Username</label>
          <input
            id="signup-username"
            value={registration.username}
            placeholder="Ghost in the Machine"
            name="username"
            autocomplete="nickname"
            minlength="1"
            maxlength="25"
            required />
        </div>
      {:else if registration.stage === 'security'}
        <p>Use an authenticator app to add a second verification step when signing in.</p>
        <div class="security-choice">
          <Button type="submit" name="enableTwoFactor" value="yes" loading={pending} icon="shield">
            Yes, enable 2FA
          </Button>
          <Button type="submit" name="enableTwoFactor" value="no" variant="secondary" disabled={pending}>
            No, skip for now
          </Button>
        </div>
      {:else if registration.stage === 'authenticator'}
        <AuthenticatorSetup qr={registration.qr} secret={registration.secret} />
        <div class="field">
          <label for="signup-totp">Authenticator code</label>
          <input
            id="signup-totp"
            placeholder="000000"
            name="token"
            inputmode="numeric"
            pattern={'[0-9]{6}'}
            oninput={(event) => {
              event.currentTarget.value = event.currentTarget.value.replace(/\s/g, '');
            }}
            maxlength="32"
            autocomplete="one-time-code"
            required />
        </div>
      {:else if registration.stage === 'recovery'}
        <p>Each code restores access if you lose your authenticator and can be used once.</p>
        <RecoveryCodes codes={registration.recovery} />
        <label class="security-copy recovery-confirm">
          <input type="checkbox" name="savedRecovery" bind:checked={savedRecovery} required />
          <span>I saved these recovery codes.</span>
        </label>
      {:else}
        <p>
          You’re all set. Your email is verified and your account details are ready. Finish creating your account to get
          started.
        </p>
      {/if}
      {#if registration.stage !== 'security'}
        <Button
          type="submit"
          loading={pending}
          disabled={registration.stage === 'recovery' && !savedRecovery}
          icon="arrow">
          {registration.stage === 'account' || (registration.stage === 'email' && registration.verified)
            ? 'Continue'
            : registration.stage === 'recovery'
              ? 'Next'
              : registration.stage === 'complete'
                ? 'Finish account creation'
                : registration.stage === 'username'
                  ? 'Continue'
                  : 'Verify'}
        </Button>
      {/if}
    </form>
    {#if registration.stage === 'account'}
      <div class="access-links signup-signin"><a href="/login">Sign in instead</a></div>
    {:else}
      <form method="POST" action="?/back" use:enhance={submit} class="access-links">
        <input type="hidden" name="stage" value={registration.stage} />
        <button class="back-link" type="submit" disabled={pending}><Icon name="back" size={15} />Back</button>
      </form>
    {/if}
  </AuthCard>
</div>

<style>
  .signup-signin {
    justify-content: center;
  }
  .security-choice {
    display: grid;
    gap: 12px;
  }
  .security-copy {
    margin: 16px 0 !important;
  }
  .recovery-confirm {
    display: flex;
    align-items: center;
    gap: 10px;
  }
</style>
