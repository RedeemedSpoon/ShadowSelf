<script lang="ts">
  import {enhance} from '$app/forms';
  import {Card} from '$components';
  import {blur} from 'svelte/transition';

  const {form}: {form: unknown} = $props();
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
  {#key form}
    <p class="absolute bottom-4 left-0 w-full text-center" transition:blur>{form && JSON.stringify(form)}</p>
  {/key}
</div>

<style lang="postcss">
  #signup {
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
