<script lang="ts">
  import type {Notification, OTP} from '$types';
  import {enhance} from '$app/forms';
  import {Card} from '$components';
  import {notify} from '$lib';

  const {form}: {form: Notification & OTP} = $props();
  let QRCodeImg: string | undefined = $state();

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
    else if (form?.secret) QRCodeImg = form.qr;
  });
</script>

<svelte:head>
  <title>ShadowSelf - Sign Up</title>
  <meta name="description" content="Sign up and create your account to start using ShadowSelf today" />
</svelte:head>

<div id="signup">
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/signup" use:enhance>
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
    <form method="POST" action="?/otp" use:enhance>
      <h1>Add 2FA to your account</h1>
      {#if QRCodeImg}
        <img src={QRCodeImg} alt="QR Code" width="300" />
        <div class="flex w-full flex-col gap-4">
          <p>Scan the QR code with your authenticator app to add 2 factor authentication:</p>
          <p>alternatively, you can use the code: <b>{form.secret}</b></p>
          <p class="text-red-500">make sure to use 'SHA512' as the algorithm</p>
        </div>
      {/if}
      <button type="submit">Yes Indeed</button>
    </form>
  </Card>
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/check" use:enhance>
      <h1>Enter the verification code</h1>
      <input type="number" name="code" class="w-full" required />
      <button type="submit">Verify</button>
    </form>
  </Card>
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
