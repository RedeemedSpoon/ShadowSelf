<script lang="ts">
  import {Slogan, Card3D, PricingTable, WordFlip, FeatureGrid, Services} from '$components';
  import {CheveronImg, BackgroundBeams, GridAndDotBackgrounds} from '$components';
  import {satisfaction, registration, management} from '$images';
  import {notify, addAnimation, addTabScrollEvent} from '$lib';
  import type {Notification} from '$types';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {onMount} from 'svelte';

  interface Props {
    data: PageData;
    form: Notification;
  }

  let {data, form}: Props = $props();

  $effect(() => {
    if (form?.message) notify(form?.message, form?.type);
  });

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
  <p class="my-6 w-3/4 text-balance text-center lg:w-1/2">
    Step into the shadows. Emerge as someone new. Our platform lets you create synthetic identities, ensuring your
    personal information remains hidden, far away from malicious threats. Experience the freedom of online interactions
    without the fear of compromise.
  </p>
  <div class="flex gap-16">
    <a href={'#' + data.ids[1]} class="no-underline">
      <button class="alt group flex items-center gap-1">
        Learn More<CheveronImg className="group-hover:rotate-90" />
      </button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>
<section id={data.ids[1]} class="!flex-col-reverse 2xl:!flex-row">
  <Card3D />
  <div class="flex flex-col items-start gap-6 max-2xl:mt-48 max-md:mt-0">
    <h6 class="-mb-4 ml-2 text-lg text-neutral-500">World's Most Advanced Identity Masking Tool</h6>
    <h1 class="text-4xl text-neutral-300 md:text-5xl">
      <span class="pretty-style text-nowrap text-6xl md:text-8xl">Reclaim Back</span>
      <br />Control of Your Data.
    </h1>
    <p>
      Unlike profit-hungry conglomerates, we’re a open-source project dedicated to fighting back. We’ve developed a
      platform that allow individuals to create synthetic identities, effectively confusing trackers and protecting your
      personal information from misuse, fraud, or theft.
    </p>
  </div>
</section>
<section id={data.ids[2]} class="relative max-md:!h-[75vh]">
  <Services />
</section>
<section id={data.ids[3]}>
  <GridAndDotBackgrounds>
    <h1 class="mt-48 text-center text-5xl md:text-6xl lg:mt-32">Less Burdens, Less Expenses.</h1>
    <div
      id="account"
      class="mt-6 flex items-center justify-center gap-16 text-balance text-center max-lg:flex-col xl:gap-32">
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
<section id={data.ids[4]} class="max-xl:!h-fit">
  <FeatureGrid />
</section>
<section id={data.ids[5]}>
  <PricingTable />
</section>
<section id={data.ids[6]} class="xl:!flex-row xl:gap-x-16">
  <div class="flex flex-col items-start gap-8">
    <WordFlip />
    <p class="w-5/6">
      While we may not be flawless, we firmly believe that we offer one of the most well-rounded solution for your
      online needs. Our service provides a great option without compromising on both your privacy and wallet, just like
      a Swiss Army knife.
    </p>
  </div>
  <div class="h-fit w-fit">
    <img
      loading="lazy"
      class="animate-shake hidden min-w-[30vw] xl:block"
      src={satisfaction}
      alt="Customer satisfaction" />
  </div>
</section>
<section id={data.ids[7]} class="relative mt-0">
  <h1 class="text-center text-6xl md:text-7xl">Join The Waitlist</h1>
  <p class="z-10 w-3/5 text-center leading-relaxed text-neutral-400 lg:w-1/2 xl:w-1/3">
    Join the waitlist to be notified when we launch. In the mean time, stay tuned for updates and new exiting features
    in the <a href="https://github.com/RedeemedSpoon/ShadowSelf">Github</a> Repository. We are just as exited as you are
    about this project and we are committed to make the world a safer and freer place.
  </p>
  <form use:enhance method="POST" class="z-10 mt-4 flex w-3/5 lg:w-1/2 xl:w-1/3">
    <input name="email" type="email" placeholder="Enter your email" />
  </form>
  <BackgroundBeams />
</section>

<style lang="postcss">
  section {
    @apply mb-16 w-full transition-all duration-[1500ms] ease-in-out last:mb-0;
    @apply flex h-screen flex-col items-center justify-center gap-6;

    &:nth-child(2),
    &:nth-child(6),
    &:nth-child(7) {
      @apply px-[10vw] max-lg:my-32 xl:gap-x-16 2xl:gap-x-32 2xl:max-2xl:px-[5vw];
    }

    &:nth-child(7) {
      @apply !mb-0 bg-gradient-to-b from-neutral-900 from-25% to-neutral-950/25 max-2xl:pb-32 max-xl:!h-fit;
    }

    &:nth-child(6) {
      @apply max-xl:!my-[25vh] max-lg:!my-0 2xl:!flex-row min-[1536px]:max-[1700px]:!flex-col;
    }
  }

  input {
    @apply z-10 w-full bg-[#070d1f] transition-all duration-300 ease-in-out;
    @apply border-primary-800 focus:ring-primary-600 focus:ring-2;
  }
</style>
