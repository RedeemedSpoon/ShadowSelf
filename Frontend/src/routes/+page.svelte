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
  <form use:enhance method="post" class="z-10 mt-4 flex w-1/3">
    <input name="email" type="email" placeholder="Enter your email" />
  </form>
  <BackgroundBeams />
</div>

<style lang="postcss">
  #join-the-waitlist {
    @apply relative flex h-screen w-screen flex-col items-center justify-center gap-6;
  }

  p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-neutral-950 focus:ring-2;
  }
</style>
