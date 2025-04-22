<script lang="ts">
  import {ExtensionLinks} from '$component';
  import {screenshot} from '$image';
</script>

<svelte:head>
  <title>ShadowSelf - Browser Extension</title>
  <meta name="description" content="Install the ShadowSelf browser extension to access remote location and change your user-agent." />
</svelte:head>

<div id="extension">
  <section class="flex flex-col items-start gap-6 max-md:items-center lg:w-1/2">
    <h1 class="max-md:text-center">Download Browser Extension</h1>
    <p class="mb-4 max-md:text-center">
      ShadowSelf provides a VPN directly in your browser. Masks IP for bypassing censorship & geo-blocks, hides activity from your ISP.
      Select different user agents to reduce fingerprinting & boost privacy.
    </p>
    <ExtensionLinks extension="shadowself" />
  </section>
  <img loading="lazy" src={screenshot} alt="shadowself extension" />
</div>

<style lang="postcss">
  @reference "tailwindcss";

  #extension {
    @apply mx-auto my-[15rem] flex min-h-[40vh] items-center justify-between gap-8 text-neutral-400 sm:w-5/6 xl:w-3/4 2xl:w-2/3;
  }

  h1 {
    @apply text-4xl font-bold text-neutral-300 max-sm:scale-75 lg:text-5xl;
  }

  img {
    @apply border-primary-700 mr-[5vw] w-64 max-w-[50%] rounded-xl border-4 max-md:hidden lg:w-96;
    @apply cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.0075];
    @apply hover:shadow-8xl hover:shadow-neutral-950/40;
  }
</style>
