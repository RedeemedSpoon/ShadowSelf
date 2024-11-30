<script lang="ts">
  import {UserIcon, PasswordIcon, VerificationIcon, RecoveryIcon} from '$icon';
  import {Steps, StepsItem, Input, Button} from '$component';
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
      <Input type="text" icon={UserIcon} name="username" placeholder="mountain eagle" />
    </div>
    <div class="flex justify-end gap-6 max-md:flex-col md:items-center">
      <label for="password">Password</label>
      <Input type="password" icon={PasswordIcon} name="password" placeholder="correct horse battery staple" />
    </div>
    <p class="mt-4 max-md:text-sm">Don't have an account? <a href="/signup">Sign up</a></p>
    <Button>Next</Button>
  </StepsItem>
  <StepsItem shouldWait={true} {backStep} index={2} action="checkOTP">
    <h1 class="!-mb-2">Enter the verification token</h1>
    <p>Open your two-factor authentication app to view your verification token and verify your identity</p>
    <Input type="number" name="token" icon={VerificationIcon} placeholder="123456" />
    <p class="-mt-4 max-md:text-sm">
      Lost your 2FA method?
      <span aria-hidden="true" onclick={() => currentStep.set(3)}>Switch to recovery codes</span>
    </p>
    <Button className="mt-2">Verify</Button>
  </StepsItem>
  <StepsItem shouldWait={true} {backStep} index={3} action="checkRecovery">
    <h1 class="!-mb-2">Enter one of your recovery codes</h1>
    <p>Use one of the recovery tokens we gave when you first created your account to verify your authenticity</p>
    <Input type="number" name="code" icon={RecoveryIcon} placeholder="123456789" />
    <Button className="mt-2">Check</Button>
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
