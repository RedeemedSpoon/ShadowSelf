<script lang="ts">
  import {Slogan, Card3D, PricingTable, WordFlip, FeatureGrid, Capabilities} from '$components';
  import {CheveronImg, BackgroundBeams, GridAndDotBackgrounds} from '$components';
  import {satisfaction, background, registration, management} from '$images';
  import type {Notification} from '$types';
  import {goto} from '$app/navigation';
  import {enhance} from '$app/forms';
  import {scrollY} from '$store';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  onMount(() => {
    const sectionsIds: string[] = [];
    const sections = document.querySelectorAll('section');
    sections.forEach((section) => sectionsIds.push(section.id));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        let currentSection = Math.ceil(($scrollY + 10) / window.innerHeight);
        currentSection = e.shiftKey ? currentSection - 2 : currentSection;
        goto(`#${sectionsIds[currentSection]}`);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('!opacity-100', '!translate-y-0');
        }
      });
    });

    sections.forEach((element) => observer.observe(element));
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

<section id="slogan" style="background-image: url({background});">
  <Slogan />
  <p class="my-6 w-1/2 text-balance text-center">
    Step into the shadows. Emerge as someone new. Our platform lets you create synthetic identities, ensuring your
    personal information remains hidden, far away from malicious threats. Experience the freedom of online interactions
    without the fear of compromise.
  </p>
  <div class="flex gap-8">
    <a href="#product" class="no-underline">
      <button class="alt group flex items-center gap-1">
        Learn More<CheveronImg className="group-hover:rotate-90" />
      </button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>
<section id="product">
  <Card3D />
  <div class="flex flex-col items-start gap-6">
    <h4 class="-mb-5 text-lg text-neutral-500">World's Most Advanced Identity Masking Tool</h4>
    <h1 class="text-5xl text-neutral-300">
      <span class="primary-style text-8xl">Reclaim Back</span><br />Control of Your Data.
    </h1>
    <p>
      Unlike profit-hungry corporations, we’re a open-source project dedicated to fighting back. Our mission is
      to protect individuals by providing the necessary tools against data breaches, misuse, and theft. We’ve developed
      a platform that lets you create synthetic identities, effectively confusing trackers and protecting your personal
      information.
    </p>
  </div>
</section>
<section id="capabilities"><Capabilities /></section>
<section id="benefits">
  <GridAndDotBackgrounds>
    <h1 class="mt-32 text-6xl">Less Burdens, Less Expenses.</h1>
    <div class="mt-10 flex w-full items-center justify-center gap-32 text-balance text-center">
      <div class="flex w-[30rem] flex-col items-center gap-8">
        <img src={registration} width="200" alt="Account Registration" />
        <h3 class="text-4xl font-bold primary-style">Account Registration</h3>
        <p>
          Use our service to create untrackable accounts and register for services while still concealing your actual
          identity from being at risk.
        </p>
      </div>
      <div class="flex w-[30rem] flex-col items-center gap-8">
        <img src={management} width="200" alt="Account Managenent" />
        <h3 class="text-4xl font-bold primary-style">Account Managenent</h3>
        <p>
          Add, delete, and update entries to manage your online accounts. Create, generate and store
          passwords/usernames, implement TOTP, etc.
        </p>
      </div>
    </div>
  </GridAndDotBackgrounds>
</section>
<section id="features"><FeatureGrid /></section>
<section id="pricing"><PricingTable /></section>
<section id="reflection">
  <div class="flex flex-col items-start gap-8">
    <WordFlip />
    <p class="w-5/6">
      While we may not be flawless, we firmly believe that we offer you one of the most well-rounded solution for your
      online needs, even though we monetize what should have been a basic human right. Our service provides a great option
      without compromising your privacy (and wallet), just like a Swiss Army knife!
    </p>
  </div>
  <img class="animate-shake image-shadow w-full min-w-[30vw]" src={satisfaction} alt="Customer satisfaction" />
</section>
<section id="waitlist" class="border-t-4 border-[#131b2d]">
  <h1>Join The Waitlist</h1>
  <p class="z-10 w-1/3 text-center leading-relaxed text-neutral-400">
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

  #slogan {
    @apply animate-scroll bg-cover bg-center bg-repeat-x;
  }

  #product,
  #pricing,
  #reflection {
    @apply flex !flex-row gap-32 px-[11.5vw];
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-[#0a0f1c] focus:ring-2;
  }
</style>
