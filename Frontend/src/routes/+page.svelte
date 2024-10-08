<script lang="ts">
  import type {Notification} from '$types';
  import {BackgroundBeams} from '$components';
  import {enhance} from '$app/forms';
  import {notify} from '$lib';

  export let form: Notification;
  $: if (form?.message) notify(form?.message, form?.type);
</script>

<section id="catch"><h1>Catch</h1></section>
<section id="product"><h1>Product</h1></section>
<section id="features"><h1>Features</h1></section>
<section id="comparaisons"><h1>Comparaisons</h1></section>
<section id="pricing"><h1>Pricing</h1></section>
<section id="reflexion"><h1>Reflexion</h1></section>

<section id="waitlist">
  <h1>Join The Waitlist</h1>
  <p>
    We are firmly grounded in privacy and security. We provide you with the tools to safeguard you and your sensitive
    data. We allow you to creating sythetic identities that can be used to register and authenticate while concealing
    your actual identity from being at risk of misuse, breach, theft, or fraud. We are committed to make the world a
    safer and freer place.
  </p>
  <form use:enhance method="post" class="z-10 mt-4 flex w-1/3">
    <input name="email" type="email" placeholder="Enter your email" />
  </form>
  <BackgroundBeams />
</section>

<style lang="postcss">
  section {
    @apply w-2/3 py-16 text-center;
  }

  #waitlist {
    @apply relative flex h-screen w-screen flex-col items-center justify-center gap-6;
  }

  #waitlist p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-neutral-950 focus:ring-2;
  }
</style>
