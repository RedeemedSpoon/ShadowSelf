<script lang="ts">
  import type {Notification} from '$types';
  import {BackgroundBeams, Cheveron} from '$components';
  import {enhance} from '$app/forms';
  import {notify} from '$lib';
  import {onMount} from 'svelte';

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('!opacity-100', '!translate-y-0');
        } else {
          entry.target.classList.remove('!opacity-100', '!translate-y-0');
        }
      });
    });

    document.querySelectorAll('section').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  });

  export let form: Notification;
  $: if (form?.message) notify(form?.message, form?.type);
</script>

<svelte:head>
  <title>ShadowSelf - Create & Manage Fake Identities</title>
  <meta
    name="description"
    content="ShadowSelf is a platform that safeguard you and your sensitive data by creating sythetic identities that can be used to register and authenticate while concealing your actual identity from being at risk of misuse, breach, theft, or fraud." />
</svelte:head>

<section id="catch">
  <h1 class="-mb-6 mt-28 text-neutral-300">Your Privacy,</h1>
  <h1 class="text-9xl">Our Priority.</h1>
  <p class="my-6 w-1/2 text-center">
    Welcome to ShadowSelf, the platform that is firmly grounded in privacy and security. We safeguard you and your
    sensitive data by creating sythetic identities that can be used to register and authenticate while concealing your
    actual identity from being at risk of misuse, breach, theft, or fraud.
  </p>
  <div class="flex gap-8">
    <a href="#product" class="no-underline">
      <button class="alt flex items-center gap-2">Learn More<Cheveron /></button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>

<!-- 3D Card Effect -->
<section id="product"><h1>Product</h1></section>
<!-- Sticky Scroll Reveal + Beams -->
<section id="features"><h1>Features</h1></section>
<!-- Unknown -->
<section id="comparaisons"><h1>Comparaisons</h1></section>
<!-- Table -->
<section id="pricing"><h1>Pricing</h1></section>
<!-- Raw Text -->
<section id="reflexion"><h1>Reflexion</h1></section>

<section id="waitlist">
  <h1>Join The Waitlist</h1>
  <p>
    Join the waitlist to be notified when we launch. In the mean time, stay tuned for updates in the Github repository
    that can be found <a href="https://github.com/RedeemedSpoon/ShadowSelf">Here</a>. We are just as exited as you are
    about this project and we are committed to make the world a safer and freer place.
  </p>
  <form use:enhance method="post" class="z-10 mt-4 flex w-1/3">
    <input name="email" type="email" placeholder="Enter your email" />
  </form>
  <BackgroundBeams />
</section>

<style lang="postcss">
  section {
    @apply w-full translate-y-32 py-16 opacity-0 transition-all duration-[1500ms] ease-in-out;
  }

  section:nth-child(even) {
    @apply bg-neutral-950;
  }

  #catch,
  #waitlist {
    @apply relative flex h-screen flex-col items-center justify-center gap-6;
  }

  #waitlist p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-neutral-950 focus:ring-2;
  }
</style>
