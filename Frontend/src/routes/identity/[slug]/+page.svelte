<script lang="ts">
  import {IdentityInformation, IdentityEmail, IdentityPhone, IdentityVirtualCard, IdentityAccounts} from '$component';
  import type {PageProps} from './$types';
  import type {Sections} from '$type';
  import {ChevronIcon} from '$icon';

  let {data}: PageProps = $props();

  let currentSection: Sections = $state('info');

  const allSections = {
    info: IdentityInformation,
    email: IdentityEmail,
    phone: IdentityPhone,
    card: IdentityVirtualCard,
    account: IdentityAccounts,
  };
</script>

<svelte:head>
  <title>ShadowSelf - {data.identity?.name}'s Identity</title>
  <meta name="description" content="Take control of your identity, personalize your preferences, and protect your privacy here." />
</svelte:head>

<div id="identity">
  {#if data.identity}
    {#each Object.keys(allSections) as section}
      <button class:enable={section === currentSection} onclick={() => (currentSection = section as Sections)}>section</button>
    {/each}
    {@const SvelteComponent = allSections[currentSection]}
    <SvelteComponent />
  {:else}
    <h1>Identity Not Found</h1>
    <p class="text-center">
      The identity you're looking for doesn't exist, or your account isn't the owner of this identity.
      <br class="max-lg:hidden" /> Please verify the URL and try again.
    </p>
    <a href="/dashboard"><button class="flex items-center gap-1">Dashboard<ChevronIcon /></button></a>
  {/if}
</div>

<style lang="postcss">
  #identity {
    @apply mx-auto my-[15rem] flex min-h-[40vh] w-5/6 flex-col items-center justify-center gap-8 text-neutral-400 md:w-1/2;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }
</style>
