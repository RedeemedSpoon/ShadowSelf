<script lang="ts">
  import type {Notification} from '$types';
  import {BackgroundBeams} from '$components';
  import {enhance} from '$app/forms';
  import {notify} from '$lib';

  export let form: Notification;
  $: if (form?.message) notify(form?.message, form?.type);
</script>

<div id="join-the-waitlist">
  <h1>Join The Waitlist</h1>
  <p>
    Welcome to ShadowSelf, the platform that is firmly grounded in privacy and security. We safeguard you and your
    sensitive data by creating sythetic identities that can be used to register and authenticate while concealing your
    actual identity from being at risk of misuse, breach, theft, or fraud.
  </p>
  <form use:enhance method="post">
    <input name="email" type="email" placeholder="Enter your email" />
  </form>
  <BackgroundBeams />
</div>

<style lang="postcss">
  #join-the-waitlist {
    @apply relative flex h-screen w-screen flex-col items-center justify-center gap-6;
  }

  h1 {
    @apply from-primary-500 to-primary-800 z-10 bg-gradient-to-b bg-clip-text font-sans text-7xl font-bold text-transparent;
  }

  p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  form {
    @apply z-10 mt-4 flex w-1/3;
  }

  input {
    @apply border-primary-800 z-10 w-full rounded-xl border bg-neutral-950 p-4;
    @apply focus:ring-primary-500 outline-none placeholder:text-neutral-700 focus:ring-2;
  }
</style>
