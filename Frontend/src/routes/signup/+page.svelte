<script lang="ts">
  import {UserIcon, PasswordIcon, VerificationIcon, DownloadIcon, CopyIcon} from '$icon';
  import {Steps, StepsItem, Input, Button, ReactiveButton} from '$component';
  import type {Notification, Registration} from '$type';
  import {currentStep} from '$store';
  import {get} from 'svelte/store';
  import {notify} from '$lib';

  const {form}: {form: Notification & Registration} = $props();

  let qr = $state() as string;
  let secret = $state() as string;
  let username = $state() as string;
  let recovery = $state() as string[];
  let anchor = $state() as HTMLAnchorElement;

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (form?.step) currentStep.set(Number(form?.step));

    if (form?.secret || form?.secret === '') secret = form.secret;
    if (form?.username) username = form.username;
    if (form?.recovery) recovery = form.recovery;
    if (form?.qr) qr = form.qr;
  });

  function copyRecovery() {
    navigator.clipboard.writeText(recovery.join('\n'));
  }

  function downloadRecovery() {
    const text = recovery.join('\n');
    const blob = new Blob([text], {type: 'text/plain'});
    anchor.href = URL.createObjectURL(blob);
    anchor.click();
  }

  function backStep() {
    let step = get(currentStep) - 1;
    step = step === 5 && !secret ? 2 : step;
    currentStep.set(step);
  }
</script>

<svelte:head>
  <title>ShadowSelf - Sign Up</title>
  <meta name="description" content="Sign up and create your account to start using ShadowSelf today" />
</svelte:head>

<Steps>
  <StepsItem shouldWait={true} {backStep} index={1} action="init">
    <h1>Create an account</h1>
    <div class="flex items-center justify-end gap-6">
      <label for="username">Username</label>
      <Input type="text" icon={UserIcon} name="username" placeholder="mountain eagle" />
    </div>
    <div class="flex items-center justify-end gap-6">
      <label for="password">Password</label>
      <Input type="password" icon={PasswordIcon} name="password" placeholder="correct horse battery staple" />
    </div>
    <p class="mt-4">Already have an account? <a href="/login">Login</a></p>
    <Button>Next</Button>
  </StepsItem>
  <StepsItem {backStep} index={2} action="askOTP">
    <h1>Hello <span class="pretty-style">{username}</span>,<br /> Would you like to enable 2FA now?</h1>
    <p class="-mt-4 mb-4">
      Two-Factor Authentication (2FA) is a common security feature<br />
      that adds an extra layer of protection to your account when trying to logging in.
    </p>
    <div class="flex w-full justify-between gap-2 px-8">
      <button class="alt" name="skip" type="submit">Skip this step</button>
      <button name="enable" type="submit">Enable 2FA →</button>
    </div>
  </StepsItem>
  <StepsItem {backStep} index={3} action="showOTP">
    <div class="mb-14 flex flex-row gap-16">
      <div class="flex flex-col items-center gap-6">
        <h1>Scan the QR code</h1>
        <img src={qr} alt="QR Code" width="200" class="w-full shadow-xl shadow-white/15" />
      </div>
      <div class="-my-6 w-[2px] bg-neutral-500"></div>
      <div class="flex w-full flex-col gap-2">
        <h1>Or enter the secret key</h1>
        <p class="mb-2">Alternatively, you can paste this secret key into your authenticator app if you don't have a phone:</p>
        <ReactiveButton isBox={true} icon={CopyIcon} text={secret} callback={() => navigator.clipboard.writeText(secret)} />
        <p class="ml-1 mt-2 text-sm text-red-500">Make sure to use 'SHA512' as the algorithm</p>
      </div>
    </div>
    <button type="submit">Next →</button>
  </StepsItem>
  <StepsItem shouldWait={true} {backStep} index={4} action="checkOTP">
    <h1 class="!-mb-2">Enter the verification token</h1>
    <p>Enter the verification token that was generated automatically by your authenticator app</p>
    <Input type="number" name="token" icon={VerificationIcon} placeholder="123456" />
    <Button className="mt-2">Verify</Button>
  </StepsItem>
  <StepsItem {backStep} index={5} action="showRecovery">
    <h1>Store safely these recovery codes</h1>
    <p>
      Store these recovery codes somewhere safe, you will need<br />
      them to restore your account in case you lose access to your 2FA method.
    </p>
    <div class="grid grid-cols-2 gap-4 rounded-xl bg-neutral-800/50 p-4">
      {#each recovery as code, index (index)}
        <p>{code}</p>
      {/each}
    </div>
    <div id="recovery-actions-buttons" class="flex justify-evenly">
      <ReactiveButton icon={CopyIcon} text="Copy to clipboard" newText="Copied!" callback={copyRecovery} />
      <ReactiveButton icon={DownloadIcon} text="Download as .txt" newText="Downloaded!" callback={downloadRecovery} />
      <a bind:this={anchor} aria-label="Download" href="/" download="ShadowSelf-recovery-codes.txt" class="hidden"></a>
    </div>
    <button type="submit">Next →</button>
  </StepsItem>
  <StepsItem {backStep} index={6} action="askBilling">
    <h1>Would you like to add a billing method now?</h1>
    <p>
      You will need a payment method to use ShadowSelf<br />
      We accept both credit cards and crypto currency
    </p>
    <button name="add" type="submit">Add Payment →</button>
    <button class="alt" name="skip" type="submit">Skip for now</button>
  </StepsItem>
  <StepsItem {backStep} index={7} action="addBilling">
    <h1>Add a billing method</h1>
    <p>Not implemented yet.</p>
    <button type="submit">Add Billing</button>
  </StepsItem>
  <StepsItem shouldWait={true} {backStep} index={8} action="create">
    <h1>And we're done!</h1>
    <p>
      Just click the button below<br />
      to finish setting up your account
    </p>
    <Button>Create the account</Button>
    <p class="-mb-6 text-sm text-neutral-400">
      By continuing, you agree to both our <br />
      <a href="/terms">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>
    </p>
  </StepsItem>
</Steps>

<style lang="postcss">
  h1 {
    @apply -mt-4 mb-4 text-nowrap text-4xl font-bold text-neutral-300;
  }

  #recovery-actions-buttons > * {
    @apply inline-flex items-center gap-2;
  }
</style>
