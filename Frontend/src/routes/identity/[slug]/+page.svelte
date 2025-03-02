<script lang="ts">
  import {IdentityInformation, IdentityEmail, IdentityPhone, IdentityCard, IdentityAccounts} from '$component';
  import {InfoIcon, EmailIcon, PhoneIcon, CreditCardIcon, MultiUsersIcon} from '$icon';
  import type {PageProps} from './$types';
  import {slide} from 'svelte/transition';
  import {currentSection} from '$store';
  import type {Sections} from '$type';
  import {ChevronIcon} from '$icon';
  import {onMount} from 'svelte';

  let {data}: PageProps = $props();

  let buttonWrapper = $state() as HTMLDivElement;

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

  function handleClick(section: Sections) {
    $currentSection = section;
    buttonWrapper.childNodes.forEach((node) => {
      (node as HTMLButtonElement).disabled = true;
      setTimeout(() => ((node as HTMLButtonElement).disabled = false), 750);
    });
  }

  onMount(() => handleClick('info'));
</script>

<svelte:head>
  <title>ShadowSelf - {data.identity?.name}'s Identity</title>
  <meta name="description" content="Take control of your identity, personalize your preferences, and protect your privacy here." />
</svelte:head>

<div id="identity">
  {#if data.identity}
    <div id="button-wrapper" bind:this={buttonWrapper} class="flex h-16">
      {#each Object.keys(allSections) as section, i}
        {@const Icon = sectionsNames[i].icon}
        <button class:main={section === $currentSection} onclick={() => handleClick(section as Sections)}>
          <Icon className="h-6 w-6" />{sectionsNames[i].name}</button>
      {/each}
    </div>
    {#key $currentSection}
      {@const SvelteComponent = allSections[$currentSection]}
      <div class="mb-12 mt-8 w-full px-8" in:slide={{delay: 400, duration: 350}} out:slide={{duration: 350}}>
        <SvelteComponent identity={data.identity as never} />
      </div>
    {/key}
    <hr class="mb-8 h-px w-full" />
    <div class="flex w-full justify-between">
      <a class="ml-8" href="/dashboard">
        <button class="!alt my-0 border-none">← Back</button>
      </a>
      <div id="danger-actions" class="flex items-center gap-4">
        <button>Cancel Subscription</button>
        <div class="h-8 w-px bg-neutral-600"></div>
        <button>Delete Identity</button>
      </div>
    </div>
  {:else}
    <div class="flex min-h-[40vh] flex-col items-center justify-center gap-8">
      <h1>Identity Not Found</h1>
      <p class="text-center">
        The identity you're looking for doesn't exist, or your account isn't the owner of the identity.
        <br class="max-lg:hidden" /> Please verify the URL and try again.
      </p>
      <a href="/dashboard">
        <button class="flex items-center gap-1">
          Dashboard<ChevronIcon />
        </button>
      </a>
    </div>
  {/if}
</div>

<style lang="postcss">
  #identity {
    @apply mx-auto my-[10rem] flex w-5/6 flex-col items-center text-neutral-400 md:w-2/3;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }

  #button-wrapper button {
    @apply flex items-center gap-2 border-b bg-none px-[4vw] text-neutral-500 shadow-transparent;
    @apply rounded-none border-b border-neutral-500 transition-colors duration-500 hover:border-neutral-400 hover:text-neutral-400;
    @apply disabled:cursor-pointer disabled:opacity-100;
  }

  #danger-actions button {
    @apply alt hover:text-alert-600 border-none px-0 py-0 text-neutral-400;
  }

  .main {
    @apply !border-b-[3px] !border-neutral-300 !text-neutral-300;
  }
</style>
