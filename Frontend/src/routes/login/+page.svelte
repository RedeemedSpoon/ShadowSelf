<script lang="ts">
  import type {Notification} from '$type';
  import {enhance} from '$app/forms';
  import {Card} from '$component';
  import {notify} from '$lib';

  const {form}: {form: Notification} = $props();

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
  });
</script>

<svelte:head>
  <title>ShadowSelf - Login</title>
  <meta name="description" content="Login to your account and start using ShadowSelf!" />
</svelte:head>

<div id="login">
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/login" use:enhance>
      <h1>Login to your account</h1>
      <div>
        <label for="username">Username</label>
        <input type="text" name="username" required id="username" />
      </div>
      <div>
        <label for="password">Password</label>
        <input type="password" name="password" required id="password" />
      </div>
      <button type="submit">Login</button>
    </form>
  </Card>
</div>

<style lang="postcss">
  #login {
    @apply mx-auto flex h-screen w-2/3 flex-col justify-center gap-12;
  }

  h1 {
    @apply -mt-4 mb-4 self-center text-4xl font-bold text-neutral-300;
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
