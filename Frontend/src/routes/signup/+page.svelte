<script lang="ts">
  import type {Notification, Registration} from '$types';
  import {Steps, StepsItem, SelectMenu} from '$components';
  import {currentStep} from '$store';
  import {notify} from '$lib';

  const {form}: {form: Notification & Registration} = $props();

  let username = $state() as string;
  let backup = $state() as string[];
  let secret = $state() as string;
  let qr = $state() as string;

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (form?.username) username = form.username;
    if (form?.backup) backup = form.backup;
    if (form?.secret) secret = form.secret;
    if (form?.qr) qr = form.qr;

    currentStep.set(Number(form?.step) || 1);
  });
</script>

<svelte:head>
  <title>ShadowSelf - Sign Up</title>
  <meta name="description" content="Sign up and create your account to start using ShadowSelf today" />
</svelte:head>

<Steps>
  <StepsItem index={1} action="init">
    <h1>Create an account</h1>
    <div class="flex gap-6">
      <label for="username">Username</label>
      <input type="text" name="username" required id="username" />
    </div>
    <div class="flex gap-6">
      <label for="password">Password</label>
      <input type="password" name="password" required id="password" />
    </div>
    <button type="submit">Sign Up</button>
  </StepsItem>
  <StepsItem index={2} action="askOTP">
    <h1>Hello {username}, Would you like to enable 2FA to your account</h1>
    <button name="add" type="submit">Add</button>
    <button name="skip" type="submit">Skip</button>
  </StepsItem>
  <StepsItem index={3} action="showOTP">
    {#if qr && secret}
      <img src={qr} alt="QR Code" width="300" />
      <div class="flex w-full flex-col gap-4">
        <p>Scan the QR code with your authenticator app to add 2 factor authentication:</p>
        <p>alternatively, you can use the code: <b>{secret}</b></p>
        <p class="text-red-500">make sure to use 'SHA512' as the algorithm</p>
      </div>
    {/if}
    <button type="submit">Next</button>
  </StepsItem>
  <StepsItem index={4} action="checkOTP">
    <h1>Enter the verification code</h1>
    <input type="number" name="code" class="w-full" required />
    <button type="submit">Verify</button>
  </StepsItem>
  <StepsItem index={5} action="showBackup">
    <h1>Please Store these Backup Codes Safely</h1>
    <div class="flex flex-col gap-4 rounded-xl bg-slate-900/50 p-4">
      {#if backup}
        {#each backup as code}
          <p>{code}</p>
        {/each}
      {/if}
      <button>Copy</button>
      <button>Download</button>
    </div>
    <button type="submit">Next</button>
  </StepsItem>
  <StepsItem index={6} action="askBilling">
    <h1>Would you like to add a billing method now?</h1>
    <button name="add" type="submit">Add</button>
    <button name="skip" type="submit">Skip</button>
  </StepsItem>
  <StepsItem index={7} action="addBilling">
    <h1>Add billing method</h1>
    <SelectMenu
      name="Plan"
      options={[
        {label: 'Monthly', value: 'monthly'},
        {label: 'Annually', value: 'annually'},
        {label: 'Lifetime', value: 'lifetime'},
      ]} />
    <button type="submit">Add</button>
  </StepsItem>
  <StepsItem index={8} action="create">
    <h1>Create account</h1>
    <button type="submit">Create</button>
  </StepsItem>
</Steps>

<style lang="postcss">
  h1 {
    @apply -mt-4 mb-4 self-center text-center text-4xl font-bold text-neutral-300;
  }

  img {
    @apply self-center shadow-lg shadow-white/15;
  }

  input {
    @apply bg-slate-900/50;
  }

  button {
    @apply w-full self-end;
  }
</style>
