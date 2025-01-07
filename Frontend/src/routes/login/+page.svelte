<script lang="ts">
  import {UserIcon, KeyIcon, KeylockIcon, RecoveryIcon} from '$icon';
  import {Steps, StepsItem, InputWithIcon, LoadingButton} from '$component';
  import type {Notification} from '$type';
  import {currentStep} from '$store';
  import {get} from 'svelte/store';
  import {notify} from '$lib';

  const {form}: {form: Notification & {step?: number}} = $props();

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (form?.step) currentStep.set(Number(form.step));
  });

  function backStep() {
    let step = get(currentStep) - 1;
    currentStep.set(step);
  }
</script>

<svelte:head>
  <title>ShadowSelf - Log in</title>
  <meta name="description" content="Log in to your account to make the most of ShadowSelf" />
</svelte:head>

<Steps>
  <StepsItem shouldWait={true} {backStep} index={1} action="checkCredentials">
    <h1>Login to your account</h1>
    <div class="flex justify-end gap-6 max-md:flex-col md:items-center">
      <label for="username">Username</label>
      <InputWithIcon type="text" icon={UserIcon} name="username" placeholder="mountain eagle" />
    </div>
    <div class="flex justify-end gap-6 max-md:flex-col md:items-center">
      <label for="password">Password</label>
      <InputWithIcon type="password" icon={KeyIcon} name="password" placeholder="correct horse battery staple" />
    </div>
    <div class="-mb-2 mt-4 flex justify-between px-3 max-md:flex-col md:items-center">
      <a class="text-md max-md:text-sm" href="/signup">Don't have an account?</a>
      <a class="text-md max-md:text-sm" href="/">Forgot password?</a>
    </div>
    <LoadingButton>Next</LoadingButton>
  </StepsItem>

  <StepsItem shouldWait={true} {backStep} index={2} action="checkOTP">
    <h1 class="!-mb-2">Enter the verification token</h1>
    <p>Open your two-factor authentication app to view your verification token and verify your identity</p>
    <InputWithIcon type="number" name="token" icon={KeylockIcon} placeholder="123456" />
    <p class="-mt-4 max-md:text-sm">
      Lost your 2FA method?
      <span aria-hidden="true" onclick={() => currentStep.set(3)}>Switch to recovery codes</span>
    </p>
    <LoadingButton className="mt-2">Verify</LoadingButton>
  </StepsItem>

  <StepsItem shouldWait={true} {backStep} index={3} action="checkRecovery">
    <h1 class="!-mb-2">Enter one of your recovery codes</h1>
    <p>Use one of the recovery tokens we gave when you first created your account to verify your authenticity</p>
    <InputWithIcon type="number" name="code" icon={RecoveryIcon} placeholder="123456789" />
    <LoadingButton className="mt-2">Check</LoadingButton>
  </StepsItem>
</Steps>

<style lang="postcss">
  h1 {
    @apply -mt-4 mb-4 text-4xl font-bold text-neutral-300 max-md:text-2xl md:text-nowrap;
  }

  span {
    @apply text-primary-600 hover:text-primary-700 cursor-pointer transition-colors duration-300;
  }
</style>
