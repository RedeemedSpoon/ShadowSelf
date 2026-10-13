<script lang="ts">
  import {untrack} from 'svelte';
  import {enhance} from '$app/forms';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import PaymentMethod from '$component/console/PaymentMethod.svelte';
  import type {ActionData} from './$types';

  let {form}: {form: ActionData} = $props();
  const initialForm = untrack(() => form);
  const registrationFields = {email: '', username: '', secret: '', qr: '', recovery: [] as string[], stripeKey: ''};
  let step = $state(Number(initialForm?.step) || 1);
  let pending = $state(false);
  let registration = $state({
    ...registrationFields,
    ...Object.fromEntries(Object.entries(initialForm || {}).filter(([key]) => key in registrationFields)),
  });
  let paymentID = $state('');
  let savedRecovery = $state(false);

  $effect(() => {
    if (!form) {
      return;
    }

    if (form.step) {
      step = Number(form.step);
    }

    registration = {...untrack(() => registration), ...Object.fromEntries(Object.entries(form).filter(([key]) => key in registrationFields))};
  });

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

  const titles: Record<number, string> = {
    1: 'Create your account',
    2: 'Verify your email',
    3: 'Choose a username',
    4: 'Two-factor authentication',
    5: 'Add your authenticator',
    6: 'Verify your authenticator',
    7: 'Save your recovery codes',
    8: 'Payment method',
    9: 'Add a card',
    10: 'Finish setup',
  };
  const actions: Record<number, string> = {
    1: 'init',
    2: 'checkEmail',
    3: 'checkUsername',
    4: 'askOTP',
    5: 'showOTP',
    6: 'checkOTP',
    7: 'showRecovery',
    8: 'askBilling',
    9: 'addBilling',
    10: 'create',
  };
</script>

<svelte:head
  ><title>Create an account | ShadowSelf</title><meta
    name="description"
    content="Create a ShadowSelf account with email verification and optional two-factor authentication." /></svelte:head>
<div class="access">
  <section class="panel">
    <h1>{titles[step]}</h1>
    {#if step === 2 || step === 7 || step === 8}<p>
        {step === 2
          ? `Code sent to ${registration.email}.`
          : step === 7
            ? 'Each code restores access if you lose your authenticator and can be used once.'
            : 'Optional. Identity purchases also accept crypto.'}
      </p>{/if}
    <Status message={form?.message || ''} kind="error" />
    <form method="POST" action="?/{actions[step]}" use:enhance={submit}>
      {#if step === 1}<div class="field">
          <label for="signup-email">Email address</label><input id="signup-email" type="email" name="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="signup-password">Account password</label><input
            id="signup-password"
            name="password"
            type="password"
            minlength="12"
            autocomplete="new-password"
            required /><small>Minimum 12 characters.</small>
        </div>{/if}
      {#if step === 2}<div class="field">
          <label for="signup-code">Email code</label><input
            id="signup-code"
            name="access"
            inputmode="numeric"
            pattern="[0-9]{8}"
            maxlength="8"
            autocomplete="one-time-code"
            required />
        </div>{/if}
      {#if step === 3}<div class="field">
          <label for="signup-username">Username</label><input
            id="signup-username"
            name="username"
            autocomplete="nickname"
            minlength="3"
            maxlength="32"
            required />
        </div>{/if}
      {#if step === 4}
        <Button name="enable" value="true" type="submit" loading={pending} icon="shield">Set up two-factor authentication</Button>
        <div class="access-links"><button type="submit">Continue without two-factor</button></div>{/if}
      {#if step === 5}<img class="qr-image" src={registration.qr} alt="Authenticator enrollment QR code" /><Copy
          value={registration.secret}
          label="Copy secret" />
        <p class="security-copy">Scan the QR code or enter this secret in your authenticator.</p>{/if}
      {#if step === 6}<div class="field">
          <label for="signup-totp">Authenticator code</label><input
            id="signup-totp"
            name="token"
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength="6"
            autocomplete="one-time-code"
            required />
        </div>{/if}
      {#if step === 7}<div class="recovery-codes">
          {#each registration.recovery as code (code)}<span>{code}</span>{/each}
        </div>
        <Copy value={registration.recovery.join('\n')} label="Copy codes" />
        <label class="security-copy recovery-confirm"><input type="checkbox" bind:checked={savedRecovery} required /> I saved these recovery codes.</label>{/if}
      {#if step === 8}<Button name="add" value="true" type="submit" loading={pending} icon="card">Add a payment card</Button>
        <div class="access-links"><button type="submit">Skip for now</button></div>{/if}
      {#if step === 9}<PaymentMethod stripeKey={registration.stripeKey} onready={(id) => (paymentID = id)} /><input
          type="hidden"
          name="paymentID"
          value={paymentID} />{/if}
      {#if step !== 4 && step !== 8}<Button type="submit" loading={pending} disabled={(step === 7 && !savedRecovery) || (step === 9 && !paymentID)} icon="arrow"
          >{step === 10 ? 'Create account' : 'Continue'}</Button
        >{/if}
      {#if step === 9}<div class="access-links">
          <button type="submit" formaction="?/askBilling" formnovalidate disabled={pending}>Skip for now</button>
        </div>{/if}
    </form>
    {#if step === 1}<div class="access-links"><a href="/login">Sign in</a></div>{/if}
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
