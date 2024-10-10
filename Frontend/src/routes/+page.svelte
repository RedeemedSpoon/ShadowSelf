<script lang="ts">
  import type {Notification} from '$types';
  import {BackgroundBeams, Cheveron} from '$components';
  import {enhance} from '$app/forms';
  import {notify} from '$lib';
  import {onMount} from 'svelte';
  import {satisfaction} from '$images';

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
      <button class="alt flex items-center gap-2">Learn More<Cheveron /></button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>
<section id="product"><h1>Product</h1></section>
<section id="features"><h1>Features</h1></section>
<section id="comparaisons"><h1>Comparaisons</h1></section>
<section id="pricing"><h1>Pricing</h1></section>
<section id="reflection" class="flex !flex-row gap-24 px-64">
  <div class="flex flex-col items-start gap-4">
    <h1>Reflexion</h1>
    <p class="w-3/5">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas vero reiciendis quo commodi. Accusantium earum
      assumenda sequi alias, aliquam doloribus voluptate hic enim quisquam, eum amet vero id esse. Perspiciatis.
    </p>
  </div>
  <img class="w-4/5" src={satisfaction} alt="Balance of positive and negative" />
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

  #waitlist p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-neutral-950 focus:ring-2;
  }
</style>
