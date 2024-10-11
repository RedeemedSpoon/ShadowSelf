<script lang="ts">
  import type {Notification} from '$types';
  import {BackgroundBeams, CheveronImg, QuestionImg} from '$components';
  import {satisfaction} from '$images';
  import {enhance} from '$app/forms';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('!opacity-100', '!translate-y-0');
        }
      });
    });

    document.querySelectorAll('section').forEach((element) => {
      observer.observe(element);
    });

    setTimeout(() => {
      const underlineText = document.querySelector('#underline-text');
      underlineText?.classList.add('!max-w-full');
    }, 1250);

    setTimeout(() => {
      const highlight = document.querySelector('#highlight') as HTMLDivElement;
      const highlightedText = document.querySelector('#highlighted-text');
      const rect = highlightedText?.getBoundingClientRect();

      highlight?.style.setProperty('height', `${rect?.height}px`);
      highlight?.style.setProperty('width', `${rect?.width}px`);

      highlightedText?.classList.add('!text-neutral-300');
      highlight?.classList.add('!max-w-full');
    }, 2000);

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
  <div class="-mb-2 mt-32 flex">
    <h1 class="mr-5 text-neutral-300">Your</h1>
    <h1 class="text-neutral-300">Privacy<span id="underline-text"></span></h1>
    <h1 class="text-neutral-300">,</h1>
  </div>
  <div class="flex">
    <h1 class="mr-6 text-9xl">Our</h1>
    <h1 id="highlighted-text">Priority</h1>
    <div id="highlight"></div>
    <h1 class="text-9xl">.</h1>
  </div>
  <p class="my-6 w-1/2 text-balance text-center">
    Welcome to ShadowSelf, the platform that is firmly grounded in privacy and security. We safeguard you and your
    sensitive data by creating sythetic identities that can be used to register and authenticate while concealing your
    actual identity from being at risk of misuse, breach, theft, or fraud.
  </p>
  <div class="flex gap-8">
    <a href="#product" class="no-underline">
      <button class="alt group flex items-center gap-2">
        Learn More<CheveronImg className="group-hover:rotate-90" /></button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>

<section id="product"><h1>Product</h1></section>

<section id="features"><h1>Features</h1></section>

<section id="comparaisons"><h1>Comparaisons</h1></section>

<section id="pricing">
  <div id="pricing-card">
    <h3>Monthly</h3>
    <div class="flex flex-col gap-4 px-16 py-10 text-center">
      <p class="-mb-6 text-neutral-600 line-through">$7.99</p>
      <h1 class="from-primary-600 to-primary-700 text-6xl">$5.99</h1>
      <p class="-mt-6 text-neutral-400">per month</p>
      <p class="text-xl">What will be included :</p>
      <div class="flex gap-8 py-4 text-left text-xl leading-loose">
        <ul class="list-inside list-disc">
          <li>Custom Identity</li>
          <li>Email Address</li>
          <li>Phone Number</li>
          <li>Log Files</li>
        </ul>
        <ul class="list-inside list-disc">
          <li>Virtual Card</li>
          <li>Crypto Wallet</li>
          <li>VPN Access</li>
          <li>24/7 Support</li>
        </ul>
      </div>
      <button>Checkout</button>
    </div>
  </div>
</section>

<section id="reflection" class="flex !flex-row gap-32 px-56">
  <div class="flex flex-col items-start gap-4">
    <h1>Reflection</h1>
    <p class="w-5/6">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas vero reiciendis quo commodi. Accusantium earum
      assumenda sequi alias, aliquam doloribus voluptate hic enim quisquam, eum amet vero id esse. Perspiciatis.
    </p>
  </div>
  <img class="animate-shake-up w-full" src={satisfaction} alt="Customer satisfaction" />
</section>

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
    @apply relative flex h-screen flex-col items-center justify-center gap-6;
  }

  section:nth-child(even) {
    @apply bg-neutral-950;
  }

  #underline-text {
    @apply from-primary-600 to-primary-800 mt-1 block h-1 max-w-0 bg-gradient-to-br transition-all duration-500;
  }

  #highlight {
    @apply from-primary-600 to-primary-800 absolute ml-64 max-w-0 bg-gradient-to-br transition-all duration-1000 ease-in-out;
  }

  #highlighted-text {
    @apply px-2 text-9xl transition-all duration-1000 ease-in-out;
  }

  #pricing-card {
    @apply rounded-2xl border-2 border-neutral-400 shadow-2xl shadow-neutral-950;
    @apply transition-all duration-500 ease-in-out hover:-translate-y-6;
  }

  h3 {
    @apply bg-primary-700 w-full rounded-t-xl border-b border-neutral-400 p-8 text-center text-3xl font-bold;
  }

  #waitlist p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-neutral-950 focus:ring-2;
  }
</style>
