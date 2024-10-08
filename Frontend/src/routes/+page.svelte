<script lang="ts">
  import type {Notification} from '$types';
  import {BackgroundBeams, Sparkles} from '$components';
  import {enhance} from '$app/forms';
  import {notify} from '$lib';

  export let form: Notification;
  $: if (form?.message) notify(form?.message, form?.type);
</script>

<section id="catch">
  <h1 class="-mb-8 text-neutral-300">Your Privacy,</h1>
  <h1 class="relative text-9xl leading-tight">Our Priority.</h1>
  <div class="relative -mt-6 h-40 w-1/3">
    <div class="light !h-[3px] blur-sm" />
    <div class="light" />
    <div class="spot !h-[5px] blur-sm" />
    <div class="spot" />
    <Sparkles minSize={0.5} maxSize={2} particleDensity={400} className="w-full h-full" particleColor="#DDDDDD" />
    <div class="mask"></div>
  </div>
  <p class="-mt-8 w-1/2">
    Welcome to ShadowSelf, the platform that is firmly grounded in privacy and security. We safeguard you and your
    sensitive data by creating sythetic identities that can be used to register and authenticate while concealing your
    actual identity from being at risk of misuse, breach, theft, or fraud.
  </p>
  <div class="flex gap-8">
    <a href="#product"><button class="alt">Learn More</button></a>
    <a href="/signup"><button>Get Started</button></a>
  </div>
</section>

<!-- 3D Card Effect -->
<section id="product"><h1>Product</h1></section>
 <!-- Sticky Scroll Reveal + Beams-->
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
    that can be found <a href="https://github.com/RedeemedSpoon/ShadowSelf">Here.</a> We are just as exited as you are about
    this project and we are committed to make the world a safer and freer place.
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

  .light {
    @apply via-primary-500 absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent to-transparent;
  }

  .spot {
    @apply via-primary-500 absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent to-transparent;
  }

  .mask {
    @apply absolute inset-0 h-full w-full bg-neutral-900 [mask-image:radial-gradient(300px_125px_at_top,transparent_20%,white)];
  }

  #catch,
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
