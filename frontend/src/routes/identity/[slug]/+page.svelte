<script lang="ts">
  import {InfoIcon, PhoneIcon, MultiUsersIcon, EmailIcon, CreditCardIcon} from '$icon';
  import {currentSection, handleResponse, identity, modalIndex} from '$store';
  import type {Sections, WebSocketMessage} from '$type';
  import IdentityInformation from './Information.svelte';
  import IdentityAccounts from './Accounts.svelte';
  import IdentityPhone from './Phone.svelte';
  import IdentityEmail from './Email.svelte';
  import IdentityCard from './Card.svelte';
  import {browser} from '$app/environment';
  import {ConfirmModal} from '$component';
  import type {PageProps} from './$types';
  import {slide} from 'svelte/transition';
  import {ChevronIcon} from '$icon';
  import {page} from '$app/state';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  let {data}: PageProps = $props();

  let buttonWrapper = $state() as HTMLDivElement;
  let ws = $state() as WebSocket;

  $identity = data.identity!;
  $currentSection = (page.url.hash?.slice(1) || 'info') as Sections;

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
    if (section) window.location.hash = section;
    $currentSection = section;

    buttonWrapper.childNodes.forEach((node) => {
      (node as HTMLButtonElement).disabled = true;
      setTimeout(() => ((node as HTMLButtonElement).disabled = false), 500);
    });
  }

  onMount(() => {
    let pingInterval: unknown;

    ws = new WebSocket(`wss://${page.url.hostname}/ws-api/${data.identity?.id}`);

    ws.onopen = () => (pingInterval = setInterval(() => ws?.send('ping'), 5000));
    ws.onerror = () => notify('Something went horribly wrong. Try reloading the page.', 'alert');
    ws.onclose = (ws) => {
      clearInterval(pingInterval as number);
      if (ws.code === 1014) notify(ws.reason, 'alert');
    };

    ws.onmessage = (event) => {
      if (Number(event.data) == event.data) return;
      if (event.data === 'pong') return;

      const response = JSON.parse(event.data) as WebSocketMessage;
      $handleResponse(response);
    };

    window.onbeforeunload = () => ws.close();
  });
</script>

<svelte:head>
  <title>ShadowSelf - {data.identity?.name}'s Identity</title>
  <meta name="description" content="{data.identity?.name}'s ShadowSelf Identity, use it to protect yourself and your data." />
</svelte:head>

<div id="identity">
  {#if data.identity && browser}
    <div id="button-wrapper" bind:this={buttonWrapper} class="flex h-16">
      {#each Object.keys(allSections) as section, i}
        {@const Icon = sectionsNames[i].icon}
        <button class:main={section === $currentSection} onclick={() => handleClick(section as Sections)}>
          <Icon className="h-6 w-6" />
          <span class="max-sm:hidden">{sectionsNames[i].name}</span>
        </button>
      {/each}
    </div>

    {#key $currentSection}
      {@const SvelteComponent = allSections[$currentSection]}
      <div class="mb-12 mt-8 w-full md:px-8" in:slide={{delay: 400, duration: 350}} out:slide={{duration: 350}}>
        <SvelteComponent />
      </div>
    {/key}

    <hr class="mb-8 h-0.5 w-full" />
    <div class="flex w-full justify-between px-8 max-sm:flex-col-reverse">
      <a href="/dashboard">
        <button class="alt border-none">← Back</button>
      </a>
      <form class="flex items-center" method="POST">
        <button type="button" onclick={() => ($modalIndex = 1)} class="alt w-fit">Delete Identity</button>
        <input type="hidden" name="id" value={data.identity.id} />
        <ConfirmModal id={1} text="Deleting permanently this identity" name="delete" />
      </form>
    </div>
  {:else}
    <div class="flex min-h-[50vh] flex-col items-center justify-center gap-8">
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
  @reference "$style";

  #identity {
    @apply mx-auto my-[10rem] flex w-3/4 flex-col items-center text-neutral-400 sm:w-5/6 xl:w-2/3;
  }

  h1 {
    @apply flex items-center gap-2 text-center text-6xl font-bold text-neutral-300 max-sm:scale-75;
  }

  #button-wrapper button {
    @apply flex items-center gap-2 border-b bg-none text-neutral-500 shadow-transparent max-md:sm:-mx-3 lg:px-[4vw];
    @apply rounded-none border-b border-neutral-500 transition-colors duration-500 hover:border-neutral-400 hover:text-neutral-400;
    @apply disabled:cursor-pointer disabled:opacity-100 max-md:sm:scale-90;
  }

  .main {
    @apply !border-b-[3px] !border-neutral-300 !text-neutral-300;
  }
</style>
