<script lang="ts">
  import {Slogan, Card3D, PricingTable, WordFlip, FeatureGrid, Services} from '$components';
  import {CheveronImg, BackgroundBeams, GridAndDotBackgrounds} from '$components';
  import {satisfaction, registration, management} from '$images';
  import {notify, addAnimation, addTabScrollEvent} from '$lib';
  import type {Notification} from '$types';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {onMount} from 'svelte';

  export let data: PageData;
  export let form: Notification;
  $: if (form?.message) notify(form?.message, form?.type);

  onMount(() => {
    addTabScrollEvent(data.ids);
    const disconnect = addAnimation(data.animations);
    return () => disconnect();
  });
</script>

<svelte:head>
  <title>ShadowSelf - Create & Manage Fake Identities</title>
  <meta
    name="description"
    content="ShadowSelf is a platform that safeguard you and your sensitive data by creating sythetic identities that can be used to register and authenticate while concealing your actual identity from being at risk of misuse, breach, theft, or fraud." />
</svelte:head>

<section id={data.ids[0]}>
  <Slogan />
  <p class="my-6 w-1/2 text-balance text-center">
    Step into the shadows. Emerge as someone new. Our platform lets you create synthetic identities, ensuring your
    personal information remains hidden, far away from malicious threats. Experience the freedom of online interactions
    without the fear of compromise.
  </p>
  <div class="flex gap-8">
    <a href={data.ids[1]} class="no-underline">
      <button class="alt group flex items-center gap-1">
        Learn More<CheveronImg className="group-hover:rotate-90" />
      </button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>
<section id={data.ids[1]}>
  <Card3D />
  <div class="flex flex-col items-start gap-6">
    <h4 class="-mb-4 ml-2 text-lg text-neutral-500">World's Most Advanced Identity Masking Tool</h4>
    <h1 class="text-5xl text-neutral-300">
      <span class="pretty-style text-8xl">Reclaim Back</span><br />Control of Your Data.
    </h1>
    <p>
      Unlike profit-hungry conglomerates, we’re a open-source project dedicated to fighting back. We’ve developed a
      platform that allow individuals to create synthetic identities, effectively confusing trackers and protecting your
      personal information from misuse, fraud, or theft.
    </p>
  </div>
</section>
<section id={data.ids[2]}><Services /></section>
<section id={data.ids[3]}>
  <GridAndDotBackgrounds>
    <h1 class="mt-28 text-6xl">Less Burdens, Less Expenses.</h1>
    <div class="mt-6 flex w-full items-center justify-center gap-32 text-balance text-center">
      <div class="flex w-[30rem] flex-col items-center gap-8">
        <img src={registration} width="200" alt="Account Registration" />
        <h2 class="from-red-500 to-rose-600 text-4xl font-bold">Account Registration</h2>
        <p>
          Use our service to create untrackable accounts and register for services while still concealing your actual
          identity from being at risk.
        </p>
      </div>
      <div class="flex w-[30rem] flex-col items-center gap-8">
        <img src={management} width="200" alt="Account Managenent" />
        <h2 class="from-green-500 to-emerald-600 text-4xl font-bold">Account Managenent</h2>
        <p>
          Add, delete, and update entries to manage your online accounts. Create, generate and store
          passwords/usernames, implement TOTP, etc.
        </p>
      </div>
    </div>
  </GridAndDotBackgrounds>
</section>
<section id={data.ids[4]}><FeatureGrid /></section>
<section id={data.ids[5]}><PricingTable /></section>
<section id={data.ids[6]}>
  <div class="flex flex-col items-start gap-8">
    <WordFlip />
    <p class="w-5/6">
      While we may not be flawless, we firmly believe that we offer one of the most well-rounded solution for your
      online needs. Our service provides a great option without compromising on both your privacy and wallet, just like
      a Swiss Army knife.
    </p>
  </div>
  <img class="animate-shake w-full min-w-[30vw]" src={satisfaction} alt="Customer satisfaction" />
</section>
<section id={data.ids[7]} class="border-t-4 border-[#131b2d]">
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
    @apply w-full py-16 opacity-100 transition-all duration-[1500ms] ease-in-out;
    @apply relative flex h-screen flex-col items-center justify-center gap-6;

    &:nth-child(2),
    &:nth-child(6),
    &:nth-child(7) {
      @apply !flex-row gap-32 px-[10vw];
    }
  }

  input {
    @apply z-10 w-full bg-[#070d1f] transition-all duration-300 ease-in-out;
    @apply border-primary-800 focus:ring-primary-600 focus:ring-2;
  }
</style>
