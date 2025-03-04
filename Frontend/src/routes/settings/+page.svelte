<script lang="ts">
  import {UserIcon, KeylockIcon, KeyIcon, CreditCardIcon, InfoIcon, DownloadIcon, CopyIcon, ExternalLinkIcon} from '$icon';
  import {Modal, InputWithButton, InputWithIcon, LoadingButton, ConfirmModal, CopyButton, ReactiveButton} from '$component';
  import {loadStripe, type Stripe, type StripeCardElement} from '@stripe/stripe-js';
  import type {Notification, Settings, SettingsForm} from '$type';
  import {notify, sendFrom, setModal} from '$lib';
  import {showModal, fetching} from '$store';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {onMount} from 'svelte';

  interface Props {
    form: Notification & Settings & SettingsForm;
    data: PageData;
  }

  let {data, form}: Props = $props();

  let list = $state() as HTMLElement;
  let anchor = $state() as HTMLAnchorElement;
  let card = $state() as StripeCardElement;
  let newEmailValue = $state() as string;
  let stripe = $state() as Stripe;

  const settings = $state(data.settings) as Settings & SettingsForm & Notification;

  const className = {
    label: '!bg-neutral-900/50 !border-neutral-700',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 !bg-neutral-900/50 !border-neutral-700',
  };

  const sections = [
    {id: 'credentials', title: 'Basic Credentials', icon: UserIcon},
    {id: '2fa', title: 'Two Factor Authentication', icon: KeylockIcon},
    {id: 'api', title: 'API Access & Key', icon: KeyIcon},
    {id: 'billing', title: 'Billing Information', icon: CreditCardIcon},
    {id: 'danger', title: 'Danger Zone', icon: InfoIcon},
  ];

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    if (settings?.message) notify(settings.message, settings.type);

    if (form && Object.hasOwn(form, 'toggleModel')) {
      if (form.toggleModel) $showModal = 1;
      else $showModal = 0;
    }

    if (form?.sessionUrl) {
      settings.sessionUrl = form.sessionUrl;
      $showModal = 0;
    }

    if (form && Object.hasOwn(form, 'OTP')) settings.OTP = form.OTP;
    if (form && Object.hasOwn(form, 'API')) settings.API = form.API;

    if (form?.recovery) settings.recovery = form.recovery;
    if (form?.secret) settings.secret = form.secret;
    if (form?.email) newEmailValue = form.email;
    if (form?.step) settings.step = form.step;
    if (form?.key) settings.key = form.key;
    if (form?.qr) settings.qr = form.qr;
  });

  function handleClick(index: number) {
    const array = Array.from(list.children);
    array.forEach((item) => item.classList.remove('!bg-neutral-300/10', 'border-l-4', '2xl:!pl-24'));
    array[index + 1].classList.add('!bg-neutral-300/10', 'border-l-4', '2xl:!pl-24');
  }

  const copyRecovery = () => navigator.clipboard.writeText(settings.recovery.join('\n'));
  const downloadRecovery = () => {
    const text = settings.recovery.join('\n');
    const blob = new Blob([text], {type: 'text/plain'});
    anchor.href = URL.createObjectURL(blob);
    anchor.click();
  };

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
    fetching.set(5);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const {paymentMethod, error} = await stripe!.createPaymentMethod({type: 'card', card});
    if (paymentMethod) {
      const input = document.querySelector('input[name="paymentID"]') as HTMLInputElement;
      const submit = document.querySelector('#submit-payment') as HTMLButtonElement;

      input.value = paymentMethod.id;
      submit.click();
    } else {
      notify(error!.message!, 'alert');
      fetching.set(0);
    }
  }

  onMount(() => {
    handleClick(0);
    $showModal = 0;
    settings.step = 1;
    if (data.stripeKey && !settings.sessionUrl) initStripe(data.stripeKey);
  });
</script>

<svelte:head>
  <title>ShadowSelf - Settings</title>
  <meta name="description" content="Change your account settings here and keep yourself secure" />
</svelte:head>

<div id="settings">
  <ul bind:this={list} class="flex flex-col bg-neutral-800/40 pt-24 max-xl:hidden">
    <li id="title">Sections</li>
    {#each sections as section, i}
      {@const SvelteComponent = section.icon}
      <a onclick={() => handleClick(i)} href="#{section.id}" style="top: {(i + 3.25) * 4}rem">
        <li class="flex items-center gap-2">
          <SvelteComponent fill={true} className="!h-8 !w-8" /><span>{section.title}</span>
        </li>
      </a>
    {/each}
  </ul>
  <section class="my-20 flex h-full w-full flex-col gap-8 px-6 xl:px-24">
    <h1 class="basic-style text-5xl font-bold">Account Settings</h1>
    <p class="-mt-6">Change your account settings here and keep yourself secure</p>

    <h2 id="credentials"><UserIcon className="!h-10 !w-10 cursor-default" />Basic Credentials :</h2>
    <form use:enhance={() => sendFrom(true, 1, true)} method="POST" action="?/email">
      <label class="md:!w-fit" for="email">Email :</label>
      <InputWithButton value={settings.email} placeholder="New address" type="email" index={1} label="Change Email" name="email" />
    </form>
    <form use:enhance={() => sendFrom(true, 3)} method="POST" action="?/username">
      <label class="md:!w-fit" for="username">Username :</label>
      <InputWithButton placeholder="New username" value={data.user} index={3} label="Change Username" name="username" />
    </form>
    <form use:enhance={() => sendFrom(true, 4)} method="POST" action="?/password">
      <label class="md:!w-fit" for="password">Password :</label>
      <InputWithButton placeholder="New password" type="password" index={4} label="Change Password" name="password" />
    </form>
    <hr />

    <h2 id="2fa"><KeylockIcon className="!h-10 !w-10 cursor-default" fill={true} />Two Factor Authentication :</h2>
    <form class="!gap-4" use:enhance={({formData}) => setModal(2, !formData.has('remove'))} method="POST" action="?/checkOtp">
      <label for="totp">Time-based one-time password :</label>
      {#if settings.OTP}
        <button formaction="?/generateOtp" type="submit" class="w-fit">Change 2FA</button>
        <button formaction="?/deleteOtp" type="submit" name="remove" class="disable w-fit">Remove 2FA</button>
      {:else}
        <button formaction="?/generateOtp" type="submit" class="enable w-fit">Add 2FA</button>
      {/if}
    </form>
    <form class="flex-col" use:enhance method="POST" action="?/recovery">
      <div class="flex justify-between gap-4 max-md:flex-col md:items-center">
        <label for="recovery">Remaining Recovery Codes :</label>
        <button disabled={!settings.OTP} type="submit" class="w-fit">Generate New Recovery Codes</button>
      </div>
    </form>
    {#if settings.OTP}
      <div id="recovery" class={settings.recovery.length ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}>
        {#each settings.recovery as code}
          <p>{code}</p>
        {:else}
          <p>No Codes Left</p>
        {/each}
      </div>
      {#if settings.recovery.length}
        <div class="flex justify-evenly max-md:flex-col max-md:items-center">
          <ReactiveButton icon={CopyIcon} text="Copy to clipboard" newText="Copied!" callback={copyRecovery} />
          <ReactiveButton icon={DownloadIcon} text="Download as .txt" newText="Downloaded!" callback={downloadRecovery} />
          <a bind:this={anchor} aria-label="Download" href="/" download="ShadowSelf-recovery-codes.txt" class="hidden"></a>
        </div>
      {/if}
    {/if}
    <hr />

    <h2 id="api"><KeyIcon className="!h-10 !w-10 cursor-default" />API Access & Key :</h2>
    <form use:enhance method="POST" action="?/toggleApi">
      <label for="access">API Access :</label>
      {#if settings.API}
        <button name="disable" type="submit" class="disable w-fit">Disable API Access</button>
      {:else}
        <button name="enable" type="submit" class="enable w-fit">Enable API Access</button>
      {/if}
    </form>
    <form use:enhance method="POST" action="?/api">
      <div class="flex gap-4 max-md:flex-col md:items-center">
        <label class="w-fit" for="key">API Key :</label>
        {#if settings.API}
          <CopyButton text={settings.key} className="md:max-lg:max-w-[20vw]" change={false} />
        {/if}
      </div>
      <button disabled={!settings.API} type="submit" class="w-fit">Generate New API Key</button>
    </form>
    <hr />

    <h2 id="billing"><CreditCardIcon fill={true} className="!h-10 !w-10 cursor-default" />Billing Information :</h2>
    <form>
      <p class="text-xl font-semibold text-neutral-300">Payment Details :</p>
      {#if settings.sessionUrl}
        <a href={settings.sessionUrl} target="_blank" rel="noopener noreferrer" id="stripe-link">Manage<ExternalLinkIcon /></a>
      {:else}
        <button class="md:w-fit" type="button" onclick={() => ($showModal = 3)}>Add Payment Method</button>
      {/if}
    </form>
    <hr />

    <h2 id="danger"><InfoIcon fill={true} className="mr-1 !h-9 !w-9 cursor-default" />Danger Zone :</h2>
    <form use:enhance={() => setModal(0)} method="POST" action="?/session">
      <label for="logout">Session Management :</label>
      <button type="submit" name="logout" class="md:-mr-4 md:w-fit">Logout</button>
      <button type="button" onclick={() => ($showModal = 4)} class="md:w-fit" name="revoke">Revoke All Session</button>
      <ConfirmModal id={4} name="revoke" text="Revoking all sessions" />
    </form>
    <form use:enhance={() => setModal(0)} method="POST" action="?/delete">
      <label for="delete">Account Deletion :</label>
      <button onclick={() => ($showModal = 5)} type="button" class="disable md:w-fit">Delete Account</button>
      <ConfirmModal id={5} name="delete" text="Deleting your account" />
    </form>
  </section>
</div>

<Modal id={1}>
  <form class="!flex-col p-8" use:enhance={() => sendFrom(true, 2, true)} method="POST" action="?/access">
    <h1 class="!-mb-2">Enter the access token</h1>
    <p>We sent an email with the access token to the new address. Enter it below to continue</p>
    <InputWithIcon {className} type="password" name="access" placeholder="1DE2F3G4H5J6K7L8" icon={KeylockIcon} />
    <LoadingButton index={2} className="mt-2">Confirm</LoadingButton>
    <input hidden value={newEmailValue} name="email" />
  </form>
</Modal>

<Modal id={2}>
  {#if settings.step === 1}
    <form use:enhance method="POST" action="?/nextOtp">
      <div class="flex items-center gap-8 max-md:flex-col xl:m-8 xl:gap-16">
        <div class="flex flex-col items-center gap-6">
          <h1>Scan the QR code</h1>
          <img src={settings.qr} alt="QR Code" width="200" class="w-5/6 shadow-xl shadow-white/15" />
        </div>
        <div class="flex flex-col gap-2">
          <h1>Or enter the secret key</h1>
          <p class="mb-2">Alternatively, you can paste this secret key into your auth app:</p>
          <CopyButton text={settings.secret} className="md:max-lg:max-w-[30vw]" change={false} />
          <p class="ml-1 mt-2 text-sm text-red-500">Make sure to use 'SHA512' as the algorithm</p>
        </div>
      </div>
      <button type="submit" class="bottom-12 right-16 !w-fit md:absolute">Next →</button>
    </form>
  {:else if settings.step === 2}
    <form use:enhance={() => sendFrom(true, 5)} method="POST" action="?/checkOtp">
      <input hidden name="secret" value={settings.secret} />
      <div class="flex flex-col gap-8 xl:m-8">
        <h1 class="!-mb-2">Enter the verification token</h1>
        <p>Enter the verification token generated by your authenticator app</p>
        <InputWithIcon type="number" name="token" {className} icon={KeylockIcon} placeholder="123456" />
        <LoadingButton index={5} className="mt-2">Verify</LoadingButton>
      </div>
    </form>
  {:else}
    <form use:enhance={() => setModal(0)} method="POST" action="?/otp">
      <input hidden name="secret" value={settings.secret} />
      <div class="flex flex-col gap-4 xl:m-8">
        <h1>2FA Setup Complete!</h1>
        <p class="md:w-[40vw]">
          You can now use 2FA to log into your account. We gave you the recovery codes below, please keep them safe
        </p>
        <div class="mx-8 mt-12 flex justify-between gap-4">
          <button class="alt" onclick={() => (settings.step = 1)} name="cancel" type="button">Cancel</button>
          <button type="submit" name="finish">Finish →</button>
        </div>
      </div>
    </form>
  {/if}
</Modal>

<Modal id={3}>
  <form class="!flex-col p-8" use:enhance={() => sendFrom(true, 5)} method="POST" action="?/payment">
    <h1 class="!-mb-2">Enter your credit card details</h1>
    <p>We use Stripe to process your payments. We don't store your details nor share them with anyone</p>
    <div id="payment"></div>
    <input hidden name="paymentID" />
    <LoadingButton type="button" onclick={pay} index={5}>Add Payment Method</LoadingButton>
    <button hidden type="submit" id="submit-payment">Submit</button>
  </form>
</Modal>

<style lang="postcss">
  #settings {
    @apply grid h-full min-h-screen w-full pt-[5rem] text-neutral-400 xl:grid-cols-[1fr_3fr];
  }

  #stripe-link {
    @apply shadow-primary-900 hover:shadow-primary-950 shadow-lg transition-all duration-300;
    @apply flex justify-center gap-1 rounded-md px-6 py-4 text-xl text-neutral-300 transition-all md:w-fit;
    @apply bg-size-200 bg-pos-0 hover:bg-pos-100 from-primary-800 to-primary-600 bg-gradient-to-t;
  }

  h1:not(.basic-style) {
    @apply text-3xl text-neutral-300 lg:text-[2.5rem];
  }

  h2 {
    @apply flex scroll-m-[12rem] items-center gap-2 text-4xl text-neutral-300;
  }

  #title {
    @apply sticky top-36 py-4 pl-16 text-4xl font-semibold text-neutral-100;
  }

  #recovery {
    @apply grid place-items-center gap-6 rounded-xl bg-neutral-800/50 p-8;
  }

  #recovery > * {
    @apply font-mono font-medium tracking-wider text-neutral-300;
  }

  ul a {
    @apply border-primary-700 sticky py-3 pl-10 text-neutral-300 2xl:pl-20;
    @apply transition-all duration-200 ease-in-out hover:bg-neutral-300/5;
  }

  ul a span {
    @apply text-nowrap;
  }

  form {
    @apply flex gap-4 max-md:flex-col md:justify-between md:gap-8;
  }

  form > * {
    @apply max-md:w-full max-md:self-center;
  }

  label {
    @apply ml-2 text-nowrap text-neutral-300;
  }
</style>
