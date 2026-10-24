<script lang="ts">
  import {untrack} from 'svelte';
  import {enhance} from '$app/forms';
  import Icon from '$component/ui/Icon.svelte';
  import AuthCard from '$component/ui/AuthCard.svelte';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import type {ActionData} from './$types';

  let {form}: {form: ActionData} = $props();
  let step = $state(untrack(() => Number(form?.step) || 1));
  let pending = $state(false);
  let message = $state(untrack(() => form?.message || ''));

  $effect(() => {
    if (form?.step) {
      step = Number(form.step);
    }

    message = form?.message || '';
  });

  function submit() {
    pending = true;
    message = '';

    return async ({update}: {update: (options: {reset: boolean}) => Promise<void>}) => {
      try {
        await update({reset: false});
      } finally {
        pending = false;
      }
    };
  }

  function switchStep(next: number) {
    step = next;
    message = '';
  }

  const titles: Record<number, string> = {
    1: 'Sign in',
    2: 'Forgot password?',
    3: 'Email verification',
    4: 'Two-factor authentication',
    5: 'Use a recovery code',
  };
  const actions: Record<number, string> = {
    1: 'checkCredentials',
    2: 'checkEmail',
    3: 'checkAccess',
    4: 'checkOTP',
    5: 'checkRecovery',
  };
</script>

<svelte:head
  ><title>Sign in | ShadowSelf</title><meta
    name="description"
    content="Sign in to your ShadowSelf identity console." /></svelte:head>
<div class="access">
  <AuthCard stage={step}>
    <h1>{titles[step]}</h1>
    {#if step > 1}<p>
        {step === 2
          ? 'Use a code sent to your email to sign in without your password. Two-factor authentication is still required when enabled.'
          : step === 3
            ? 'The eight-digit email code expires in ten minutes.'
            : step === 4
              ? 'Enter the six-digit authenticator code.'
              : 'Recovery codes are single-use.'}
      </p>{/if}
    <Status {message} kind="error" />
    <form method="POST" action="?/{actions[step]}" use:enhance={submit}>
      {#if step === 1 || step === 2}<div class="field">
          <label for="login-email">Email address</label><input
            id="login-email"
            name="email"
            type="email"
            maxlength="254"
            autocomplete="username"
            placeholder="you@example.com"
            required />
        </div>{/if}
      {#if step === 1}<div class="field">
          <label for="login-password">Password</label><input
            id="login-password"
            placeholder="Correct Horse Battery Staple"
            name="password"
            type="password"
            autocomplete="current-password"
            required />
        </div>{/if}
      {#if step === 3 || step === 4}<div class="field">
          <label for="login-code">Verification code</label><input
            id="login-code"
            name={step === 3 ? 'access' : 'token'}
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern={step === 3 ? '[0-9]{8}' : '[0-9]{6}'}
            maxlength={step === 3 ? 8 : 6}
            placeholder={step === 3 ? '00000000' : '000000'}
            required />
        </div>{/if}
      {#if step === 5}<div class="field">
          <label for="login-recovery">Recovery code</label><input
            id="login-recovery"
            placeholder="Your saved recovery code"
            name="code"
            autocomplete="off"
            required />
        </div>{/if}
      <Button type="submit" loading={pending} icon="arrow"
        >{step === 1 ? 'Sign in' : step === 2 ? 'Send access code' : 'Verify'}</Button>
    </form>
    <div class="access-links">
      {#if step === 1}<a href="/signup">Create an account</a><button onclick={() => switchStep(2)}
          >Forgot password?</button
        >{:else}<button class="back-link" onclick={() => switchStep(1)}><Icon name="back" size={15} />Back</button
        >{#if step === 4}<button onclick={() => switchStep(5)}>Use recovery code</button>{:else if step === 5}<button
            onclick={() => switchStep(4)}>Use authenticator</button
          >{/if}{/if}
    </div>
  </AuthCard>
</div>
