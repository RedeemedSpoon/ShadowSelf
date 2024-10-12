<script lang="ts">
  import {BackgroundBeams, CheveronImg, CheckmarkImg, Slogan} from '$components';
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
      <button class="alt group flex items-center gap-1">
        Learn More<CheveronImg className="group-hover:rotate-90" /></button>
    </a>
    <a href="/signup"><button>Get Started!</button></a>
  </div>
</section>

<section id="product">
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

<section id="features"><h1>Features</h1></section>

<section id="comparaisons"><h1>Comparaisons</h1></section>

<section id="pricing">
  <div id="pricing-model">
    <button id="monthly" class="selected" on:click={() => changePricingModel('monthly')}>Monthly</button>
    <button id="annually" on:click={() => changePricingModel('annually')}>Annually</button>
    <button id="lifetime" on:click={() => changePricingModel('lifetime')}>Lifetime</button>
  </div>
  <div id="pricing-card">
    <h3>{$pricingModel.title}</h3>
    <div class="flex flex-col items-center gap-4 px-16 py-6 text-center">
      <p class="-mb-7 text-neutral-600 line-through">${$pricingModel.price}</p>
      <h1 class="flex items-start text-6xl">
        <span class="mt-3 text-4xl">$</span>
        {$pricingModel.afterDiscount}
      </h1>
      <p class="-mt-6 mb-8 text-neutral-400">{$pricingModel.description}</p>
      <p>What will be included :</p>
      <div class="flex gap-8 py-4 text-left text-xl leading-10">
        <ul class="list-inside">
          <li><CheckmarkImg />Custom Identity</li>
          <li><CheckmarkImg />Email Address</li>
          <li><CheckmarkImg />Phone Number</li>
        </ul>
        <ul class="mx-8 list-inside">
          <li><CheckmarkImg />Virtual Card</li>
          <li><CheckmarkImg />Crypto Wallet</li>
          <li><CheckmarkImg />VPN Access</li>
        </ul>
        <ul class="list-inside">
          <li><CheckmarkImg />Account Management</li>
          <li><CheckmarkImg />Money-Back Guarantee</li>
          <li><CheckmarkImg />24/7 Support</li>
        </ul>
      </div>
      <a href="/signup">
        <button id="purchase">Purchase<CheveronImg /></button>
      </a>
      <p class="text-neutral-500">All major crypto currencies are supported.</p>
    </div>
  </div>
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

  #pricing-model {
    @apply mb-10 flex gap-0 rounded-xl border-2 border-neutral-300 bg-neutral-300 shadow-xl shadow-neutral-900;
  }

  #pricing-model button {
    @apply rounded-none px-8 py-6 text-2xl font-bold text-neutral-300 shadow-none;
    @apply first:rounded-l-xl first:border-r last:rounded-r-xl last:border-l;
  }

  #pricing-model button.selected {
    @apply text-primary-700 from-neutral-300 to-[#b3bdcc];
  }

  #pricing-card {
    @apply rounded-2xl border-4 border-neutral-400 shadow-2xl shadow-neutral-900;
    @apply bg-gradient-to-br from-[#0e1526] to-[#0a0f1b];
    @apply hover:shadow-8xl transition-all duration-500 ease-in-out hover:-translate-y-4;
  }

  #purchase {
    @apply my-4 flex w-full items-center justify-center gap-2 p-6 text-3xl font-bold;
  }

  #waitlist p {
    @apply z-10 w-1/3 hyphens-none text-balance text-center text-lg text-neutral-400;
  }

  h3 {
    @apply from-primary-600 to-primary-700 bg-gradient-to-b shadow-md shadow-neutral-950;
    @apply w-full rounded-none rounded-t-xl border-b border-neutral-400 p-8 text-center text-3xl font-bold;
  }

  li {
    @apply flex items-center gap-4;
  }

  input {
    @apply border-primary-800 focus:ring-primary-600 z-10 w-full bg-neutral-950 focus:ring-2;
  }
</style>
