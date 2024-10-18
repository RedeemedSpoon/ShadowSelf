<script lang="ts">
  import {BackgroundBeams, CheveronImg, Slogan, Card3D, PricingTable, FeatureGrid, Capabilities} from '$components';
  import {satisfaction, background} from '$images';
  import {notify, changePricingModel} from '$lib';
  import type {Notification} from '$types';
  import {goto} from '$app/navigation';
  import {enhance} from '$app/forms';
  import {scrollY} from '$store';
  import {onMount} from 'svelte';

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
    Step into the shadows. Emerge as someone new. Our platform lets you create synthetic personas, ensuring your
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
  <div class="flex flex-col items-start gap-8">
    <h1 class="text-6xl">Reclaim Control of Your Data.</h1>
    <p>
      Unlike profit-hungry conglomerates, we’re a open-source driven project dedicated to fighting back. Our mission is
      to protect individuals by providing the necessary tools against data breaches, misuse, and theft. We’ve developed
      a platform that lets you create synthetic identities, effectively confusing trackers and protecting your personal
      information.
    </p>
  </div>
</section>

<section id="capabilities"><Capabilities /></section>

<section id="features"><FeatureGrid /></section>

<section id="pricing">
  <div class="flex flex-col items-center gap-4">
    <h1>Select Your Plan</h1>
    <p class="text-balance text-center">
      We're not fans of subscriptions either, but someone's gotta pay the bills. Our lifetime plan is a fair deal.
    </p>
    <div id="pricing-model">
      <button id="monthly" class="selected" on:click={() => changePricingModel('monthly')}>Monthly</button>
      <button id="annually" on:click={() => changePricingModel('annually')}>Annually</button>
      <button id="lifetime" on:click={() => changePricingModel('lifetime')}>Lifetime</button>
    </div>
  </div>
  <PricingTable />
</section>

<section id="reflection">
  <div class="flex flex-col items-start gap-8">
    <h1 class="text-6xl">The simple, secure, and affordable way to do it all.</h1>
    <p>
      While we may not be flawless, we firmly believe that we offer one of the most well-rounded solution for your
      online needs, even though we monetize what should be a basic human right. Our service provides a budget-friendly
      and user-friendly option without compromising your privacy (and wallet), somewhat like a Swiss Army knife:
      reliable, secure, and incredibly convenient to use.
    </p>
  </div>
  <img class="animate-shake w-full min-w-[30vw]" src={satisfaction} alt="Customer satisfaction" />
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

  #product,
  #pricing,
  #reflection {
    @apply flex !flex-row gap-32 px-36;
  }

  #slogan {
    @apply animate-scroll bg-cover bg-center bg-repeat-x;
  }

  #pricing-model {
    @apply m-4 mb-12 flex w-fit gap-0 rounded-xl border-2 border-neutral-300 bg-neutral-300 shadow-xl shadow-neutral-900;
  }

  #pricing-model button {
    @apply rounded-none px-8 py-6 text-2xl font-bold text-neutral-300 shadow-xl;
    @apply first:rounded-l-xl first:border-r last:rounded-r-xl last:border-l;
  }

  #pricing-model button.selected {
    @apply text-primary-700 from-neutral-300 to-[#b3bdcc];
  }

  #waitlist p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-xl leading-relaxed text-neutral-400;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-[#0a0f1c] focus:ring-2;
  }
</style>
