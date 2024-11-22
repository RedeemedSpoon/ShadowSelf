<script lang="ts">
  import type {Notification, Registration} from '$types';
  import {enhance} from '$app/forms';
  import {Card} from '$components';
  import {notify} from '$lib';

  const {form}: {form: Notification & Registration} = $props();

  let username = $derived(form?.username);
  let backup = $derived(form?.backup);
  let secret = $derived(form?.secret);
  let step = $derived(form?.step);
  let qr = $derived(form?.qr);

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
  });
</script>

<svelte:head>
  <title>ShadowSelf - Sign Up</title>
  <meta name="description" content="Sign up and create your account to start using ShadowSelf today" />
</svelte:head>

<div id="signup">
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/init" use:enhance>
      <h1>Create an account</h1>
      <div>
        <label for="username">Username</label>
        <input type="text" name="username" required id="username" />
      </div>
      <div>
        <label for="password">Password</label>
        <input type="password" name="password" required id="password" />
      </div>
      <button type="submit">Sign Up</button>
    </form>
  </Card>
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/askOTP" use:enhance>
      <h1>hello {username}, Add 2FA to your account</h1>
      {#if qr && secret}
        <img src={qr} alt="QR Code" width="300" />
        <div class="flex w-full flex-col gap-4">
          <p>Scan the QR code with your authenticator app to add 2 factor authentication:</p>
          <p>alternatively, you can use the code: <b>{secret}</b></p>
          <p class="text-red-500">make sure to use 'SHA512' as the algorithm</p>
        </div>
      {/if}
      <button name="add" type="submit">Add</button>
      <button name="skip" type="submit">Skip</button>
    </form>
  </Card>
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/check" use:enhance>
      <h1>Enter the verification code</h1>
      <input type="number" name="code" class="w-full" required />
      <button type="submit">Verify</button>
    </form>
  </Card>
  <Card upperClass="w-fit flex self-center">
    <h1>Please Store these Backup Codes Safely</h1>
    <div class="flex flex-col gap-4 rounded-xl bg-slate-900/50 p-4">
      {#if backup}
        {#each backup as code}
          <p>{code}</p>
        {/each}
      {/if}
      <button>Copy</button>
      <button>Download</button>
    </div></Card>
</div>

<style lang="postcss">
  #signup {
    @apply mx-auto flex h-screen w-2/3 justify-center gap-12;
  }

  h1 {
    @apply -mt-4 mb-4 self-center text-4xl font-bold text-neutral-300;
  }

  img {
    @apply self-center shadow-lg shadow-white/15;
  }

  form {
    @apply flex flex-col items-end gap-8 px-12 py-16;

    & input {
      @apply bg-slate-900/50;
    }
    & div {
      @apply flex gap-6;
    }
    & button {
      @apply w-full self-end;
    }
  }
</style>
