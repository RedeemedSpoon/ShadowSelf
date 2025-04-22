<script lang="ts">
  import {LogoutIcon, IssuesIcon, ChangelogIcon, CommunityIcon, FilterIcon, SortIcon, ChevronIcon} from '$icon';
  import {EmailIcon, PhoneIcon, CreditCardIcon, MultiUsersIcon, AddUserIcon} from '$icon';
  import {user, filterOverflow, sortAsc, token} from '$store';
  import {onMount, type Component} from 'svelte';
  import {SearchInput} from '$component';
  import type {PageData} from './$types';
  import {worldMap} from '$image';
  import {notify} from '$lib';

  const {data}: {data: PageData} = $props();

  let table = $state() as HTMLElement;
  let errorText = $state() as HTMLParagraphElement;

  if (!$user) {
    $user = data.user;
    $token = data.token;
  }

  const bottomLinks = {
    Issues: ['https://github.com/RedeemedSpoon/ShadowSelf/issues', IssuesIcon],
    Changelog: ['https://github.com/RedeemedSpoon/ShadowSelf/blob/master/CHANGELOG.md', ChangelogIcon],
    Community: ['https://github.com/RedeemedSpoon/ShadowSelf/blob/master/CONTRIBUTING.md', CommunityIcon],
  };

  function handleSearch(result: string[]) {
    if (!data.identities.length) return;

    const children = Array.from(table.children);
    children.forEach((child) => {
      child.classList.add('hidden!');
      child.classList.remove('border-0!');
    });

    if (!result.length) {
      errorText.classList.remove('hidden!');
      return;
    }

    result.forEach((id) => table.querySelector('#identity-' + id)!.classList.remove('hidden!'));
    errorText.classList.add('hidden!');
    fixBorder(children);
  }

  function filterTable() {
    if (!data.identities.length) return;

    if ($filterOverflow) {
      table.style.maxHeight = '40vh';
      table.style.overflowY = 'scroll';
    } else {
      table.style.maxHeight = 'none';
      table.style.overflowY = 'hidden';
    }
  }

  function sortTable() {
    if (!data.identities.length) return;

    const children = Array.from(table.children);
    const reverse = children.reverse();
    table.replaceChildren(...reverse);
    fixBorder(children);
  }

  function fixBorder(children: Element[]) {
    const allVisible = children.filter((child) => !child.classList.contains('hidden!'));
    allVisible[allVisible.length - 1].classList.remove('border-0!');
    allVisible[0].classList.add('border-0!');
  }

  onMount(() => {
    if (data.recoveryRemaining === 0) notify('You have no recovery codes left. Please generate new ones', 'info');
    if ($filterOverflow) filterTable();
    if (!$sortAsc) sortTable();
  });
</script>

<svelte:head>
  <title>ShadowSelf - Dashboard</title>
  <meta name="description" content="Use our dashboard to control your ShadowSelf identities and manage your online privacy" />
</svelte:head>

<div id="dashboard">
  {#if data.identities.length}
    <div class="my-4 sm:max-md:mx-24 sm:max-md:mt-32 sm:max-md:scale-125 2xl:mx-[5vw]">
      <div class="flex items-center justify-between gap-4 max-md:flex-col">
        <h1 class="max-xl:text:3xl text-[2.75rem] text-neutral-300 max-md:text-2xl">
          Welcome back, <span class="pretty-style">{$user}</span>
        </h1>
        <div class="flex items-center max-md:scale-75">
          <button onclick={() => (($filterOverflow = !$filterOverflow), filterTable())} class="px-0">
            <FilterIcon />
          </button>
          <button onclick={() => (($sortAsc = !$sortAsc), sortTable())}>
            <SortIcon />
          </button>
          <SearchInput keywords={data.searchKeywords} {handleSearch} />
        </div>
      </div>
      <p bind:this={errorText} id="error" class="hidden!">No results found.</p>
      <section bind:this={table} class="mt-10 h-fit min-h-[50vh]">
        {#each data.identities as identity}
          {#if !identity.name}
            <a class="flex! gap-6! max-md:mb-24" href="/create?id={identity.id}">
              <AddUserIcon />
              <p class="text-neutral-300! max-xl:block! text-2xl">Continue Creation Process... (ID : {identity.id})</p>
            </a>
          {:else}
            {@const phone = identity.phone.replace('+', '').replace(/(\d{1})(\d{3})(\d{3})(\d{4})(\d{3})/, '+$1 $2 $3 $4$5')}
            {@const cardNumber = identity.card.toString().replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')}
            <a href="/identity/{identity.id}" id="identity-{identity.id}">
              <img loading="lazy" src={`data:image/png;base64,${identity.picture}`} alt="{identity.name}'s picture" />
              <div class="text-nowrap">
                <p class="text-neutral-300! text-nowrap">{identity.name}</p>
                <br />
                <span class="inline-flex gap-2 text-sm text-neutral-500">
                  <img src="https://flagsapi.com/{identity.country}/flat/24.png" alt="country flag" />
                  {identity.location}
                </span>
              </div>
              <br />
              <p class="md:max-lg:flex! lg:max-xl:flex!"><EmailIcon className={'h-6! w-6! stroke-primary-600!'} />{identity.email}</p>
              <p class="lg:max-xl:flex!"><PhoneIcon />{phone}</p>
              <p><CreditCardIcon />{cardNumber}</p>
              <p><MultiUsersIcon />{identity.accounts}</p>
            </a>
          {/if}
        {/each}
        <a class="flex! gap-6! max-md:mb-24" href="/purchase">
          <AddUserIcon />
          <p class="text-neutral-300! max-xl:block! text-2xl">Create a new identity</p>
        </a>
      </section>
    </div>
    <hr class="max-md:hidden" />
    <div class="-my-8 flex justify-between max-md:hidden lg:mx-6">
      <a href="/logout"><button><LogoutIcon />Logout</button></a>
      <div class="flex lg:gap-3">
        {#each Object.entries(bottomLinks) as [name, [url, Icon]]}
          {@const SvelteComponent = Icon as Component}
          <a href={url as string} rel="external">
            <button><SvelteComponent />{name}</button>
          </a>
        {/each}
      </div>
    </div>
  {:else}
    <div id="empty">
      <h1 class="basic-style mt-16 max-md:text-5xl md:mt-28">Start by making an identity</h1>
      <p class="text-neutral-300! mb-4 w-2/3">
        You can craft as many identities as you want. They are completely isolated from each other and can be used for a variety of
        purposes.
      </p>
      <img src={worldMap} alt="world map" class="absolute -z-20 w-full max-xl:top-[3rem]" />
      <a href="/purchase">
        <button id="create-identity" class="flex items-center gap-1">
          Create an identity <ChevronIcon />
        </button>
      </a>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "$style";

  #dashboard {
    @apply mx-auto mb-[4rem] mt-[10rem] flex h-fit w-5/6 flex-col gap-12;
  }

  #empty {
    @apply relative mx-auto mt-8 flex min-h-[30rem] max-w-[60rem] flex-col items-center gap-6 text-center md:min-h-[40rem] lg:w-2/3;
  }

  button:not(#create-identity) {
    @apply alt flex items-center gap-3 text-neutral-400 hover:text-neutral-300;
  }

  section > a {
    @apply flex items-center gap-2 border-t border-neutral-500 first:border-none max-md:gap-6 md:grid;
    @apply md:grid-cols-[5rem_14rem_auto_16.5rem] lg:grid-cols-[5rem_14rem_auto_16.5rem_12rem];
    @apply xl:grid-cols-[5rem_14rem_auto_16.5rem_12rem_17rem_auto] 2xl:grid-cols-[5rem_12.5rem_auto_17rem_12.5rem_18rem_6rem];
    @apply cursor-pointer px-8 py-6 transition-colors duration-300 ease-in-out hover:bg-neutral-300/10;
  }

  a > img {
    @apply h-14 rounded-full shadow-inner;
  }

  a > p {
    @apply max-xl:hidden;
  }

  p {
    @apply inline-flex items-center gap-2 text-neutral-400;
  }

  #error {
    @apply absolute inset-y-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl !text-neutral-500;
  }
</style>
