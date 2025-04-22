<script lang="ts">
  import {Slogan, InteractiveCard, Billing, WordFlip, FeatureGrid, ServicesList, FloatingAvatars} from '$component';
  import {BackgroundBeams, GridAndDotBackgrounds, Sparkle} from '$component';
  import {addAnimation, addTabScrollEvent} from '$dom';
  import {registration, management} from '$image';
  import {user, scrollUsingTab} from '$store';
  import type {PageData} from './$types';
  import {goto} from '$app/navigation';
  import {ChevronIcon} from '$icon';
  import {onMount} from 'svelte';

  let {data}: {data: PageData} = $props();

  onMount(() => {
    if (window.location.hash) {
      scrollUsingTab.set(true);
      setTimeout(() => scrollUsingTab.set(false), 150);
      goto(window.location.hash);
    }

    addTabScrollEvent(data.homepageIds);
    const disconnect = addAnimation(data.animations);
    return () => disconnect();
  });
</script>

<svelte:head>
  <title>ShadowSelf - Create & Manage Fake Identities</title>
  <meta
    name="description"
    content="ShadowSelf is a platform that safeguard you and your sensitive data by creating synthetic identities that can be used to register and authenticate while concealing your actual identity from being at risk of misuse, breach, theft, or fraud." />
</svelte:head>

<section id={data.homepageIds[0]} class="h-screen! p-8!">
  <Slogan />
  <p class="my-4 w-3/4 text-balance text-center max-sm:w-full lg:w-1/2">
    Step into the shadows. Emerge as someone new. Our platform lets you create synthetic identities, ensuring your personal information
    remains hidden, far away from malicious threats. Experience the freedom of online interactions without the fear of compromise.
  </p>
  <div class="flex gap-16 max-sm:flex-col-reverse max-sm:items-center max-sm:gap-8">
    <a href={'#' + data.homepageIds[1]} class="no-underline">
      <button class="alt group flex items-center gap-1">
        Learn More<ChevronIcon className="group-hover:rotate-90" />
      </button>
    </a>
    <a href={$user ? '/dashboard' : '/signup'}><button>Get Started!</button></a>
  </div>
</section>

<section id={data.homepageIds[1]} class="flex-col-reverse! px-[15vw]! 2xl:flex-row!">
  <InteractiveCard />
  <div class="flex flex-col items-start gap-6 max-2xl:mt-48 max-md:mt-20">
    <h6 class="-mb-4 ml-2 text-lg text-neutral-500 max-sm:text-sm">The Most Advanced Identity Masking Tool</h6>
    <h1 class="text-3xl text-neutral-300 sm:text-4xl md:text-5xl">
      <span class="pretty-style text-nowrap text-5xl sm:text-6xl md:text-8xl">Reclaim Back</span>
      <br />Control of Your Data.
    </h1>
    <p>
      Unlike profit-hungry conglomerates, we’re a open-source project dedicated to fighting back. We’ve developed a platform that allow
      individuals to create synthetic identities, effectively confusing trackers and protecting your personal information from misuse,
      fraud, or theft.
    </p>
  </div>
</section>

<section id={data.homepageIds[2]} class="sm:h-screen! relative">
  <ServicesList />
</section>

<section id={data.homepageIds[3]}>
  <GridAndDotBackgrounds>
    <h1 class="text-center text-4xl md:text-6xl lg:mt-32">Less Burdens, Less Expenses.</h1>
    <div id="account" class="mt-6 flex items-center justify-center gap-16 text-balance text-center max-lg:flex-col xl:gap-32">
      <div class="flex flex-col items-center gap-8 sm:w-[30rem]">
        <img src={registration} width="200" alt="Account Registration" class="max-sm:w-[150px]" />
        <h2 class="from-red-500 to-rose-600 text-3xl font-bold sm:text-4xl">Account Registration</h2>
        <p class="max-sm:px-8">
          Use our service to create untrackable accounts and register for services while still concealing your actual identity from
          being at risk.
        </p>
      </div>
      <div class="flex flex-col items-center gap-8 sm:w-[30rem]">
        <img src={management} width="200" alt="Account Managenent" class="max-sm:w-[150px]" />
        <h2 class="from-green-500 to-emerald-600 text-3xl font-bold sm:text-4xl">Account Managenent</h2>
        <p class="max-sm:px-8">
          Add, delete, and update entries to manage your online accounts. Create, generate and store passwords/usernames, implement
          TOTP, etc.
        </p>
      </div>
    </div>
  </GridAndDotBackgrounds>
</section>

<section id={data.homepageIds[4]}>
  <FeatureGrid />
</section>

<section id={data.homepageIds[5]}>
  <Billing />
</section>

<section id={data.homepageIds[6]} class="xl:flex-row! xl:gap-x-16">
  <div class="flex flex-col items-start gap-8">
    <WordFlip />
    <p class="mb-24 w-5/6">
      We offers a holistic approach to your digital life, ensuring top-tier privacy doesn't break the bank. Forget juggling multiple
      services or settling for less, our platform provides the well-rounded protection you need in one place. Get serious security that
      respects both your privacy needs and your budget.
    </p>
  </div>
  <FloatingAvatars />
</section>

<section id={data.homepageIds[7]} class="mt-0! h-screen! relative overflow-hidden">
  <h1 class="text-wrap text-center text-6xl text-neutral-300 md:text-7xl">
    <div class="relative">
      <Sparkle className="-top-4 right-[18rem]" size="w-9 h-9" delay={26} />
      <Sparkle className="-top-6 right-96" size="w-7 h-7" delay={45} />
      <Sparkle className="-bottom-24 right-[24rem]" delay={12} />
    </div>
    Unlock<span class="pretty-style mx-3 italic">True</span>Privacy
  </h1>
  <p class="z-10 w-3/5 text-center lg:w-1/2 xl:w-1/3">
    Don't leave your online privacy to chance. ShadowSelf delivers the critical advantage you need, regardless of your current
    expertise. Gain the control and security essential for navigating the modern web. It's time to step up.
  </p>
  <a class="z-10 mt-8" href={$user ? '/dashboard' : '/signup'}>
    <button id="action" style="background-position: 50%;">Take Control Now!</button>
  </a>
  <BackgroundBeams />
</section>

<style lang="postcss">
  @reference "tailwindcss";

  section {
    @apply h-fit min-h-[50rem] w-full transition-all duration-[1500ms] ease-in-out last:mb-0;
    @apply flex flex-col items-center justify-center gap-6 sm:py-16 2xl:py-32;

    &:nth-child(2),
    &:nth-child(6),
    &:nth-child(7) {
      @apply px-[10vw] xl:gap-x-16 2xl:gap-x-32;
    }

    &:nth-child(7) {
      @apply bg-linear-to-b !mb-0 from-neutral-900 from-25% to-neutral-950/25;
    }

    &:nth-child(6) {
      @apply max-lg:!my-0 2xl:!flex-row min-[1536px]:max-[1720px]:!flex-col;
    }

    #action {
      @apply bg-linear-to-r from-blue-500 via-indigo-600 to-purple-700 bg-[150%] px-12 py-8 text-3xl hover:!bg-[100%];
    }
  }
</style>
