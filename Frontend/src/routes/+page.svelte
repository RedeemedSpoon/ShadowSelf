<script lang="ts">
  import {BackgroundBeams, CheveronImg, Slogan} from '$components';
  import {notify, changePricingModel} from '$lib';
  import type {Notification} from '$types';
  import {satisfaction} from '$images';
  import {pricingModel} from '$store';
  import {enhance} from '$app/forms';

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
  <Slogan />
  <p class="my-6 w-1/2 text-balance text-center">
    Experience the freedom of online interactions without the fear of compromise. Our platform provides the tools to
    craft synthetic identities, shielding your personal information from malicious threats. Step into a realm where your
    digital profile is cloaked in security with ShadowSelf.
  </p>
  <div class="flex gap-8">
    <a href="#product" class="no-underline">
      <button class="alt group flex items-center gap-2">
        Learn More<CheveronImg className="group-hover:rotate-90" /></button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>

<section id="product">
  <div class="flex flex-col items-start gap-4">
    <h1 class="text-6xl">Reclaim Control of Your Data.</h1>
    <p>
      Unlike profit-hungry conglomerates, we’re a open-source driven project dedicated to fighting back. Our mission is
      to protect individuals by providing the necessary tools against data breaches, misuse, and theft. We’ve developed
      a platform that lets you create synthetic identities, effectively confusing trackers and protecting your personal
      information.
    </p>
  </div>
</section>

<section id="features"><h1>Features</h1></section>

<section id="comparaisons"><h1>Comparaisons</h1></section>

<section id="pricing">
  <div id="pricing-model">
    <button id="monthly" on:click={() => changePricingModel('monthly')}>Monthly</button>
    <button id="annually" on:click={() => changePricingModel('annually')}>Annually</button>
    <button id="lifetime" on:click={() => changePricingModel('lifetime')}>Lifetime</button>
  </div>
  <div id="pricing-card">
    <h3 class="text-3xl">{$pricingModel.name}</h3>
    <div class="flex flex-col gap-4 px-16 py-10 text-center">
      <p class="-mb-6 text-neutral-600 line-through">${$pricingModel.price}</p>
      <h1 class="from-primary-600 to-primary-700 text-6xl">${$pricingModel.afterDiscount}</h1>
      <p class="-mt-6 mb-8 text-neutral-400">{$pricingModel.description}</p>
      <p class="text-xl">What will be included :</p>
      <div class="flex gap-8 py-4 text-left text-xl leading-loose">
        <ul class="list-inside list-disc">
          <li>Custom Identity</li>
          <li>Email Address</li>
          <li>Phone Number</li>
        </ul>
        <ul class="list-inside list-disc">
          <li>Virtual Card</li>
          <li>Crypto Wallet</li>
          <li>VPN Access</li>
        </ul>
        <ul class="list-inside list-disc">
          <li>Account Management</li>
          <li>24/7 Support</li>
          <li>Money-Back Guarantee</li>
        </ul>
      </div>
      <button>Checkout</button>
    </div>
  </div>
</section>

<section id="reflection">
  <div class="flex flex-col items-start gap-4">
    <h1 class="text-6xl">The simple, secure, and affordable way to do it all.</h1>
    <p>
      While we may not be flawless, we firmly believe that we offer one of the most well-rounded solution for your
      online needs, even though we monetize what should be a basic human right. Our service provides a budget-friendly
      and user-friendly option without compromising your privacy (and wallet), somewhat like a Swiss Army knife:
      reliable, secure, and incredibly convenient to use.
    </p>
  </div>
  <img class="animate-shake-up w-full min-w-[30vw]" src={satisfaction} alt="Customer satisfaction" />
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

  #product,
  #reflection {
    @apply flex !flex-row gap-36 px-52;
  }

  #pricing-model { }

  .selected { }

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
