<script lang="ts">
  import {UserIcon, KeylockIcon, KeyIcon, CreditCardIcon, InfoIcon, CopyIcon} from '$icon';
  import {InputWithButton, ConfirmModal, ReactiveButton} from '$component';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {showModal} from '$store';
  import {onMount} from 'svelte';
  import {sendFrom} from '$lib';

  let {data}: {data: PageData} = $props();

  let list: HTMLElement;
  const sections = [
    {
      id: '#credentials',
      title: 'Basic Credentials',
      color: 'blue',
      icon: UserIcon,
    },
    {
      id: '#2fa',
      title: 'Two Factor Authentication',
      color: 'orange',
      icon: KeylockIcon,
    },
    {
      id: '#api',
      title: 'API Access & Key',
      color: 'yellow',
      icon: KeyIcon,
    },
    {
      id: '#billing',
      title: 'Billing Information',
      color: 'green',
      icon: CreditCardIcon,
    },
    {
      id: '#danger',
      title: 'Danger Zone',
      color: 'red',
      icon: InfoIcon,
    },
  ];

  function handleClick(index: number) {
    const array = Array.from(list.children);
    array.forEach((item) => item.classList.remove('!bg-neutral-300/10', 'border-l-4', '!pl-24'));
    array[index + 1].classList.add('!bg-neutral-300/10', 'border-l-4', '!pl-24');
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
      <a class={section.color} onclick={() => handleClick(i)} href={section.id} style="top: {(i + 3.25) * 4}rem">
        <li class="flex items-center gap-2">
          <SvelteComponent className="!h-8 !w-8" /><span class="text-neutral-300">{section.title}</span>
        </li>
      </a>
    {/each}
  </ul>
  <section class="mb-32 mt-20 flex h-full w-full flex-col gap-8 px-24">
    <h1 class="basic-style text-5xl font-bold">Account Settings</h1>
    <p class="-mt-6">Change your account settings here and keep yourself secure</p>

    <h2 id="credentials"><UserIcon className="!h-10 !w-10 cursor-default" />Basic Credentials</h2>
    <form use:enhance={() => sendFrom(true)} method="POST">
      <label class="w-fit" for="username">Username</label>
      <InputWithButton placeholder="Give new username" value={data.user} label="Change Username" name="username" type="text" />
    </form>
    <form class="mt-4 flex flex-col" use:enhance method="POST">
      <div class="inline-grid grid-cols-2 gap-8">
        <div class="flex flex-col gap-4">
          <label for="currentPassword">Current Password</label>
          <input name="newPassword" type="password" placeholder="New password" />
        </div>
        <div class="flex flex-col gap-4">
          <label for="newPassword">New Password</label>
          <input name="currentPassword" type="password" placeholder="Current password" />
        </div>
      </div>
      <button class="w-fit self-end" type="button" onclick={() => ($showModal = 1)}>Change Password</button>
      <ConfirmModal id={1} text="Changing your password" />
    </form>
    <hr />

    <h2 id="2fa"><KeylockIcon className="!h-10 !w-10 cursor-default" />Two Factor Authentication</h2>
    <form use:enhance method="POST">
      <label for="totp">Time-based one-time password (TOTP) :</label>
      {#if data.userSettings.has2FA}
        <button class="from-red-800 to-red-700 shadow-red-800 hover:shadow-red-900">Remove 2FA</button>
      {:else}
        <button class="from-green-800 to-green-700 shadow-green-800 hover:shadow-green-900">Add 2FA</button>
      {/if}
      <button>Change 2FA</button>
    </form>
    <form class="flex-col" use:enhance method="POST">
      <div class="flex items-center justify-between">
        <label for="recovery">Remaining Recovery Codes :</label>
        <button>Generate New Recovery Codes</button>
      </div>
      <div id="recovery">
        {#each data.userSettings.recoveryCodes as code}
          <p>{code}</p>
        {/each}
      </div>
    </form>
    <hr />

    <h2 id="api"><KeyIcon className="!h-10 !w-10 cursor-default" />API Access & Key</h2>
    <form use:enhance method="POST">
      <label for="access">API Access :</label>
      {#if data.userSettings.hasApiAccess}
        <button class="from-red-800 to-red-700 shadow-red-800 hover:shadow-red-900">Disable API Access</button>
      {:else}
        <button class="from-green-800 to-green-700 shadow-green-800 hover:shadow-green-900">Enable API Access</button>
      {/if}
    </form>
    <form use:enhance method="POST">
      <div class="flex items-center gap-4">
        <label class="w-fit" for="key">API Key :</label>
        <ReactiveButton callback={() => navigator.clipboard.writeText('key')} icon={CopyIcon} text="ezfhzeuif" isBox={true} />
      </div>
      <button>Generate New API Key</button>
    </form>
    <hr />

    <h2 id="billing"><CreditCardIcon className="!h-10 !w-10 cursor-default" />Billing Information</h2>
    <form class="flex-col" use:enhance method="POST">
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
      <button class="w-fit self-end" type="submit">Update Billing</button>
    </form>
    <hr />

    <h2 id="danger"><InfoIcon className="!h-9 !w-9 cursor-default" />Danger Zone</h2>
    <form use:enhance method="POST">
      <label for="logout">Session Management :</label>
      <button class="alt -mr-4">Logout</button>
      <button>Revoke All Session</button>
    </form>
    <form use:enhance method="POST">
      <label for="delete">Account Deletion :</label>
      <button>Delete Account</button>
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
    @apply grid grid-cols-3 place-items-center gap-6 rounded-xl bg-neutral-800/50 p-8 font-mono font-medium tracking-wider;
  }

  ul a {
    @apply sticky py-3 pl-20 text-neutral-300 transition-all duration-200 ease-in-out hover:bg-neutral-300/5;
  }

  form {
    @apply flex justify-between gap-8;
  }

  label {
    @apply ml-2 text-nowrap text-neutral-300;
  }

  button {
    @apply w-fit text-nowrap;
  }

  .red {
    @apply border-red-500 !text-red-500;
  }

  .yellow {
    @apply border-yellow-500 text-yellow-500;
  }

  .green {
    @apply border-green-500 text-green-500;
  }

  .blue {
    @apply border-blue-500 text-blue-500;
  }

  .orange {
    @apply border-orange-500 text-orange-500;
  }
</style>
