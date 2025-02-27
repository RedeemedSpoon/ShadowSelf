<script lang="ts">
  import {IdentityInformation, IdentityEmail, IdentityPhone, IdentityCard, IdentityAccounts} from '$component';
  import {InfoIcon, EmailIcon, PhoneIcon, CreditCardIcon, MultiUsersIcon} from '$icon';
  import type {PageProps} from './$types';
  import type {Sections} from '$type';
  import {ChevronIcon} from '$icon';

  let {data}: PageProps = $props();

  let currentSection: Sections = $state('info');

  const sectionsNames = [
    {name: 'Information', icon: InfoIcon},
    {name: 'Email', icon: EmailIcon},
    {name: 'Phone', icon: PhoneIcon},
    {name: 'Card', icon: CreditCardIcon},
    {name: 'Accounts', icon: MultiUsersIcon},
  ];

  const allSections = {
    info: IdentityInformation,
    email: IdentityEmail,
    phone: IdentityPhone,
    card: IdentityCard,
    account: IdentityAccounts,
  };
</script>

<svelte:head>
  <title>ShadowSelf - {data.identity?.name}'s Identity</title>
  <meta name="description" content="Take control of your identity, personalize your preferences, and protect your privacy here." />
</svelte:head>

<div id="identity">
  {#if data.identity}
    <div class="flex h-16">
      {#each Object.keys(allSections) as section, i}
        {@const Icon = sectionsNames[i].icon}
        <button class:main={section === currentSection} onclick={() => (currentSection = section as Sections)}>
          <Icon className="h-6 w-6" />{sectionsNames[i].name}</button>
      {/each}
    </div>
    {@const SvelteComponent = allSections[currentSection]}
    <SvelteComponent />
  {:else}
    <h1>Identity Not Found</h1>
    <p class="text-center">
      The identity you're looking for doesn't exist, or your account isn't the owner of the identity.
      <br class="max-lg:hidden" /> Please verify the URL and try again.
    </p>
    <a href="/dashboard">
      <button id="reload" class="flex items-center gap-1">
        Dashboard<ChevronIcon />
      </button>
    </a>
  {/if}
</div>

<style lang="postcss">
  #identity {
    @apply mx-auto my-[15rem] flex w-5/6 flex-col items-center justify-center gap-8 text-neutral-400 md:w-1/2;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }

  button:not(#reload) {
    @apply flex items-center gap-2 border-b bg-none px-12 text-neutral-500 shadow-transparent;
    @apply rounded-none border-b border-neutral-500 transition-colors duration-500 hover:border-neutral-400 hover:text-neutral-400;
  }

  .main {
    @apply !border-b-[3px] !border-neutral-300 !text-neutral-300;
  }
</style>
