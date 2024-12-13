<script lang="ts">
  import {UserIcon, KeylockIcon, KeyIcon, CreditCardIcon, InfoIcon, DownloadIcon, CopyIcon} from '$icon';
  import {InputWithButton, LoadingButton, ConfirmModal, ReactiveButton} from '$component';
  import {notify, sendFrom, clearModal} from '$lib';
  import type {Notification} from '$type';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {showModal} from '$store';
  import {onMount} from 'svelte';

  interface Props {
    form: Notification & {OTP: boolean; API: boolean; key: string};
    data: PageData;
  }

  let {data, form}: Props = $props();

  let anchor = $state() as HTMLAnchorElement;
  let list = $state() as HTMLElement;
  const settings = $state(data.settings);

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

    if (form && Object.hasOwn(form, 'OTP')) settings.OTP = form.OTP;
    if (form && Object.hasOwn(form, 'API')) settings.API = form.API;
    if (form?.key) settings.key = form.key;
  });

  function handleClick(index: number) {
    const array = Array.from(list.children);
    array.forEach((item) => item.classList.remove('!bg-neutral-300/10', 'border-l-4', '!pl-24'));
    array[index + 1].classList.add('!bg-neutral-300/10', 'border-l-4', '!pl-24');
  }

  function copyKey() {
    navigator.clipboard.writeText(settings.key);
  }

  function copyRecovery() {
    navigator.clipboard.writeText(settings.recovery.join('\n'));
  }

  function downloadRecovery() {
    const text = settings.recovery.join('\n');
    const blob = new Blob([text], {type: 'text/plain'});
    anchor.href = URL.createObjectURL(blob);
    anchor.click();
  }

  onMount(() => handleClick(0));
</script>

<svelte:head>
  <title>ShadowSelf - Settings</title>
  <meta name="description" content="Change your account settings here and keep yourself secure" />
</svelte:head>

<div id="settings">
  <ul bind:this={list} class="flex flex-col bg-neutral-800/40 pt-24 max-lg:hidden">
    <li id="title">Sections</li>
    {#each sections as section, i}
      {@const SvelteComponent = section.icon}
      <a onclick={() => handleClick(i)} href="#{section.id}" style="top: {(i + 3.25) * 4}rem">
        <li class="flex items-center gap-2">
          <SvelteComponent className="!h-8 !w-8" /><span>{section.title}</span>
        </li>
      </a>
    {/each}
  </ul>
  <section class="mb-32 mt-20 flex h-full w-full flex-col gap-8 px-24">
    <h1 class="basic-style text-5xl font-bold">Account Settings</h1>
    <p class="-mt-6">Change your account settings here and keep yourself secure</p>

    <h2 id="credentials"><UserIcon className="!h-10 !w-10 cursor-default" />Basic Credentials :</h2>
    <form use:enhance={() => sendFrom(true, 1)} method="POST" action="?/username">
      <label class="w-[12.5%]" for="username">Username :</label>
      <InputWithButton placeholder="New username" value={data.user} index={1} label="Change Username" name="username" />
    </form>
    <form class="flex" use:enhance={() => sendFrom(true, 2)} method="POST" action="?/password">
      <label class="w-[12.5%]" for="password">Password :</label>
      <InputWithButton placeholder="New password" type="password" index={2} label="Change Password" name="password" />
    </form>
    <hr />

    <h2 id="2fa"><KeylockIcon className="!h-10 !w-10 cursor-default" />Two Factor Authentication :</h2>
    <form class="!gap-4" use:enhance method="POST" action="?/otp">
      <label for="totp">Time-based one-time password (TOTP) :</label>
      {#if settings.OTP}
        <button type="button" class="w-fit">Change 2FA</button>
        <button type="submit" name="remove" class="disable w-fit">Remove 2FA</button>
      {:else}
        <button type="button" class="enable w-fit">Add 2FA</button>
      {/if}
    </form>
    <form class="flex-col" use:enhance={() => sendFrom(true, 3)} method="POST" action="?/recovery">
      <div class="flex items-center justify-between">
        <label for="recovery">Remaining Recovery Codes :</label>
        <LoadingButton disabled={!settings.OTP} index={3} className="w-fit">Generate New Recovery Codes</LoadingButton>
      </div>
    </form>
    {#if settings.OTP}
      <div id="recovery" class={settings.recovery.length ? 'grid-cols-3' : 'grid-cols-1'}>
        {#each settings.recovery as code}
          <p>{code}</p>
        {:else}
          <p>No Codes Left</p>
        {/each}
      </div>
      {#if settings.recovery.length}
        <div class="flex justify-evenly">
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
    <form use:enhance={() => sendFrom(true, 4)} method="POST" action="?/api">
      <div class="flex items-center gap-4">
        <label class="w-fit" for="key">API Key :</label>
        {#if settings.API}
          <ReactiveButton callback={copyKey} icon={CopyIcon} text={settings.key} isBox={true} />
        {/if}
      </div>
      <LoadingButton disabled={!settings.API} index={4} className="w-fit">Generate New API Key</LoadingButton>
    </form>
    <hr />

    <h2 id="billing"><CreditCardIcon className="!h-10 !w-10 cursor-default" />Billing Information :</h2>
    <form class="flex-col" use:enhance={({formData}) => sendFrom(true, 5, formData.has('update'))} method="POST" action="?/billing">
      <div class="inline-grid grid-cols-2 gap-8">
        <div class="flex flex-col gap-4">
          <label for="billing">Billing 1</label>
          <input class="w-full" name="billing" type="text" placeholder="Billing" />
        </div>
        <div class="flex flex-col gap-4">
          <label for="billing">Billing 2</label>
          <input class="w-full" name="billing" type="text" placeholder="Billing" />
        </div>
      </div>
      <label class="-mb-4" for="billing">Billing 3</label>
      <input name="billing" type="text" placeholder="Billing" />
      <label class="-mb-4" for="billing">Billing 4</label>
      <input name="billing" type="text" placeholder="Billing" />
      <div class="flex w-fit gap-4 self-end">
        <LoadingButton index={5} name="update" className="w-fit">Update Billing</LoadingButton>
        <button type="submit" class="disable w-fit" formaction="?/deleteBilling">Delete Billing</button>
      </div>
    </form>
    <hr />

    <h2 id="danger"><InfoIcon className="mr-1 !h-9 !w-9 cursor-default" />Danger Zone :</h2>
    <form use:enhance={() => clearModal()} method="POST" action="?/session">
      <label for="logout">Session Management :</label>
      <button type="submit" name="logout" class="-mr-4 w-fit">Logout</button>
      <button type="button" onclick={() => ($showModal = 1)} class="w-fit" name="revoke">Revoke All Session</button>
      <ConfirmModal id={1} name="revoke" text="Revoking all sessions" />
    </form>
    <form use:enhance={() => clearModal()} method="POST" action="?/delete">
      <label for="delete">Account Deletion :</label>
      <button onclick={() => ($showModal = 2)} type="button" class="disable w-fit">Delete Account</button>
      <ConfirmModal id={2} name="delete" text="Deleting your account" />
    </form>
  </section>
</div>

<style lang="postcss">
  #settings {
    @apply grid h-full min-h-screen w-full grid-cols-[1fr_3fr] pt-[5rem] text-neutral-400;
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
    @apply border-primary-700 sticky py-3 pl-20 text-neutral-300 transition-all duration-200 ease-in-out hover:bg-neutral-300/5;
  }

  form {
    @apply flex justify-between gap-8;
  }

  label {
    @apply ml-2 text-nowrap text-neutral-300;
  }
</style>
