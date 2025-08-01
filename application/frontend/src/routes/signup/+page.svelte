<script lang="ts">
  import {UserIcon, KeyIcon, KeylockIcon, DownloadIcon, CopyIcon, HappyIcon, EmailIcon, QuestionIcon} from '$icon';
  import {Steps, StepsItem, InputWithIcon, LoadingButton, CopyButton, ReactiveButton, Tooltip} from '$component';
  import {loadStripe, type Stripe, type StripeCardElement} from '@stripe/stripe-js';
  import type {Notification, Registration} from '$type';
  import {currentStep, fetchIndex} from '$store';
  import {get} from 'svelte/store';
  import {notify} from '$lib';

  const {form}: {form: Notification & Registration & {stripeKey?: string}} = $props();

  let qr = $state() as string;
  let secret = $state() as string;
  let username = $state() as string;
  let recovery = $state() as string[];

  let anchor = $state() as HTMLAnchorElement;
  let card = $state() as StripeCardElement;
  let stripe = $state() as Stripe;
  let key = $state() as string | undefined;

  $effect(() => {
    if (form && Object.hasOwn(form, 'stripeKey')) key = form.stripeKey;
    if (key) initStripe(key);

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

  async function initStripe(stripeKey: string) {
    stripe = (await loadStripe(stripeKey!)) as Stripe;
    card = stripe!.elements().create('card', {
      classes: {
        base: 'rounded-xl border p-4 transition-all duration-300 border-neutral-800 bg-neutral-800/30',
        focus: 'ring-2 ring-primary-700',
      },
      style: {
        base: {
          color: '#cbd5e1',
          iconColor: '#94a3b8',
          '::placeholder': {color: '#94a3b8'},
        },
      },
    });

    setTimeout(() => card.mount('#payment'), 300);
    return 9;
  }

  async function pay() {
    fetchIndex.set(1);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const {paymentMethod, error} = await stripe!.createPaymentMethod({type: 'card', card});
    if (paymentMethod) {
      const input = document.querySelector('input[name="paymentID"]') as HTMLInputElement;
      const submit = document.querySelector('#submit-payment') as HTMLButtonElement;

      input.value = paymentMethod.id;
      submit.click();
    } else {
      notify(error!.message!, 'alert');
      fetchIndex.set(0);
    }
  }

  async function backStep() {
    let step = get(currentStep) - 1;
    step = step === 7 && !secret ? 4 : step;
    step = step === 9 ? (!key ? 8 : await initStripe(key!)) : step;
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
    <div class="flex justify-end gap-6 max-md:flex-col md:items-center">
      <label for="email">Email</label>
      <InputWithIcon type="email" icon={EmailIcon} fill={true} name="email" placeholder="example@domain.tld" />
    </div>
    <div class="flex justify-end gap-6 max-md:flex-col md:items-center">
      <label for="password">Password</label>
      <InputWithIcon type="password" icon={KeyIcon} name="password" placeholder="correct horse battery staple" />
    </div>
    <div class="-mb-2 mt-4 flex justify-between text-nowrap px-3 max-md:flex-col md:items-center">
      <a class="text-md max-md:text-sm md:mr-8" href="/login">Already have an account?</a>
      <Tooltip tip="Password must be at least 8 characters long. It must contain 1 lowercase letter, 1 uppercase letter and 1 number">
        <div class="group/tooltip-password flex cursor-context-menu select-none items-center gap-[2px]">
          <h6 class="text-md group-hover/tooltip-password:text-neutral-400 max-md:text-sm">Password requirements</h6>
          <QuestionIcon className="h-5 fill-neutral-300 group-hover/tooltip-password:fill-neutral-400" />
        </div>
      </Tooltip>
    </div>
    <LoadingButton>Next</LoadingButton>
  </StepsItem>

  <StepsItem shouldWait={true} {backStep} index={2} action="checkEmail">
    <h1 class="-mb-2!">Verify your email address</h1>
    <p>We sent you an email with an access token. Enter it below to continue</p>
    <InputWithIcon type="password" name="access" placeholder="1DE2F3G4H5J6K7L8" icon={KeylockIcon} />
    <LoadingButton className="mt-2">Continue</LoadingButton>
  </StepsItem>

  <StepsItem shouldWait={true} {backStep} index={3} action="checkUsername">
    <h1 class="-mb-2!">Enter your username</h1>
    <p>Enter a username for your account. You can change it later</p>
    <InputWithIcon type="text" name="username" icon={UserIcon} placeholder="Greed" />
    <LoadingButton className="mt-2">Continue</LoadingButton>
  </StepsItem>

  <StepsItem {backStep} index={4} action="askOTP">
    <h1>Hello <span class="pretty-style">{username}</span>,<br /> Would you like to enable 2FA now?</h1>
    <p class="-mt-4 mb-8">
      Two-Factor Authentication (2FA) is a common security feature that adds an extra layer of protection to your account when trying
      to logging in.
    </p>
    <div class="flex w-full justify-between gap-2 px-8 max-md:flex-col-reverse">
      <button class="alt" name="skip" type="submit">Skip this step</button>
      <button name="enable" type="submit">Enable 2FA →</button>
    </div>
  </StepsItem>

  <StepsItem {backStep} index={5} action="showOTP">
    <div class="mb-10 flex flex-row items-center gap-12 max-xl:flex-col md:gap-24 md:px-10">
      <div class="flex flex-col items-center gap-6">
        <h1>Scan the QR code</h1>
        <img src={qr} alt="QR Code" width="200" class="w-11/12 shadow-xl shadow-white/15" />
      </div>
      <div class="flex w-full flex-col gap-2">
        <h1>Or enter the secret key</h1>
        <p class="mb-2">Alternatively, you can paste this secret key into your auth app if you don't have a phone:</p>
        <CopyButton text={secret} change={false} />
        <p class="ml-1 mt-2 text-sm text-red-500">Make sure to use 'SHA512' as the algorithm</p>
      </div>
    </div>
    <button type="submit">Next →</button>
  </StepsItem>

  <StepsItem shouldWait={true} {backStep} index={6} action="checkOTP">
    <h1 class="-mb-2!">Enter the verification token</h1>
    <p>Enter the verification token that was generated automatically by your authenticator app</p>
    <InputWithIcon type="number" name="token" icon={KeylockIcon} placeholder="123456" />
    <LoadingButton className="mt-2">Verify</LoadingButton>
  </StepsItem>

  <StepsItem {backStep} index={7} action="showRecovery">
    <h1>Store safely these recovery codes</h1>
    <p class="-mt-6">
      Store these recovery codes somewhere safe, you will need them to restore your account if you lose your 2FA method.
    </p>
    <div id="recovery">
      {#each recovery as code, index (index)}
        <p>{code}</p>
      {/each}
    </div>
    <div id="recovery-actions-buttons" class="-mt-4 flex justify-evenly max-md:flex-col max-md:items-center">
      <ReactiveButton icon={CopyIcon} text="Copy to clipboard" newText="Copied!" callback={copyRecovery} />
      <ReactiveButton icon={DownloadIcon} text="Download as .txt" newText="Downloaded!" callback={downloadRecovery} />
      <a bind:this={anchor} aria-label="Download" href="/" download="ShadowSelf-recovery-codes.txt" class="hidden"></a>
    </div>
    <button type="submit">Next →</button>
  </StepsItem>

  <StepsItem {backStep} index={8} action="askBilling">
    <h1 class="-mb-2!">Want to add a payment option?</h1>
    <p>You will need a payment method to use ShadowSelf in it full capacity. We currently only accept credit cards</p>
    <div class="mt-8 flex justify-between gap-2 px-8 max-md:flex-col-reverse">
      <button class="alt" name="skip" type="submit">Skip for now</button>
      <button name="add" type="submit">Add Payment →</button>
    </div>
  </StepsItem>

  <StepsItem {backStep} index={9} action="addBilling">
    <h1 class="-mb-2!">Enter your credit card details</h1>
    <p>We use Stripe to process your payments. We don't store your details nor share them with anyone</p>
    <div id="payment"></div>
    <input hidden name="paymentID" />
    <LoadingButton type="button" onclick={pay}>Add Payment Method</LoadingButton>
    <button hidden type="submit" id="submit-payment">Submit</button>
  </StepsItem>

  <StepsItem shouldWait={true} {backStep} index={10} action="create">
    <HappyIcon className="w-36 h-36 -mt-12" />
    <h1 class="-mb-2! text-center">And we're done, <span class="pretty-style">{username}</span></h1>
    <p class="-mt-2 mb-4 text-center">
      Just click the button below to finish setting up your account. You can still go back to make changes
    </p>
    <LoadingButton>Create the account</LoadingButton>
    <p class="-mb-6 text-center text-sm text-neutral-400">
      By continuing, you agree to our
      <a href="/terms">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>
    </p>
  </StepsItem>
</Steps>

<style lang="postcss">
  @reference "$style";

  h1 {
    @apply -mt-4 mb-4 text-4xl font-bold text-neutral-300 max-md:text-2xl md:text-nowrap;
  }

  #recovery {
    @apply grid place-items-center gap-6 rounded-xl bg-neutral-800/50 p-8 font-mono font-medium tracking-wider md:grid-cols-3;
  }

  #recovery-actions-buttons > * {
    @apply inline-flex items-center gap-2;
  }
</style>
