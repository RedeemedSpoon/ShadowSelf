<script lang="ts">
  import {LogoutIcon, IssuesIcon, ChangelogIcon, CommunityIcon, FilterIcon, SortIcon} from '$icon';
  import {EmailIcon, PhoneIcon, CreditCardIcon, AccountsIcon} from '$icon';
  import {SearchInput} from '$component';
  import type {PageData} from './$types';
  import type {Component} from 'svelte';
  import {user} from '$store';

  const {data}: {data: PageData} = $props();

  const bottomLinks = {
    Issues: ['https://github.com/RedeemedSpoon/ShadowSelf/issues', IssuesIcon],
    Changelog: ['https://github.com/RedeemedSpoon/ShadowSelf/blob/master/CHANGELOG.md', ChangelogIcon],
    Community: ['https://github.com/RedeemedSpoon/ShadowSelf/blob/master/CONTRIBUTING.md', CommunityIcon],
  };

  function handleSearch(_result: string[]) {}
</script>

<svelte:head>
  <title>ShadowSelf - Dashboard</title>
  <meta name="description" content="Use our dashboard to control your ShadowSelf identities and manage your online privacy" />
</svelte:head>

<div id="dashboard">
  <div class="my-4 sm:max-md:mx-24 sm:max-md:mt-32 sm:max-md:scale-125 2xl:mx-[5vw]">
    <div class="flex items-center justify-between gap-4 max-md:flex-col">
      <h1 class="max-xl:text:3xl text-[2.75rem] text-neutral-300 max-md:text-2xl">
        Welcome back, <span class="pretty-style">{$user}</span>
      </h1>
      <div class="flex items-center max-md:scale-75">
        <button class="px-0"><FilterIcon /></button>
        <button><SortIcon /></button>
        <SearchInput keywords={data.keywords} {handleSearch} />
      </div>
    </div>
    <section>
      {#each data.identities as identity}
        {@const phone = identity.phone.toString().replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
        {@const cardNumber = identity.card.toString().replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')}
        <a href="/identity/{identity.id}">
          <img src={identity.avatar} alt="{identity.name}'s avatar" />
          <div class="text-nowrap">
            <p class="!text-neutral-300">{identity.name}</p>
            <br />
            <span class="inline-flex gap-2 text-sm text-neutral-500">
              <img src="https://flagsapi.com/{identity.country}/flat/16.png" alt="country flag" />
              {identity.location}
            </span>
          </div>
          <br />
          <p class="md:max-lg:!flex lg:max-xl:!flex"><EmailIcon />{identity.email}</p>
          <p class="lg:max-xl:!flex"><PhoneIcon />{phone}</p>
          <p><CreditCardIcon />{cardNumber}</p>
          <p><AccountsIcon />{identity.accounts}</p>
        </a>
      {/each}
    </section>
  </div>
  <hr class="h-px border-0 bg-neutral-500 max-md:hidden" />
  <div class="-my-8 flex justify-between max-md:hidden lg:mx-6">
    <a href="/logout"> <button><LogoutIcon />Logout</button> </a>
    <div class="flex lg:gap-3">
      {#each Object.entries(bottomLinks) as [name, [url, Icon]]}
        {@const SvelteComponent = Icon as Component}
        <a href={url as string} rel="external">
          <button><SvelteComponent />{name}</button>
        </a>
      {/each}
    </div>
  </div>
</div>

<style lang="postcss">
  #dashboard {
    @apply mx-auto mb-[4rem] mt-[10rem] flex h-fit w-5/6 flex-col gap-12;
  }

  button {
    @apply alt flex items-center gap-3 text-neutral-400 hover:text-neutral-300;
  }

  section {
    @apply mt-10 h-fit min-h-[50vh] divide-y divide-neutral-500;
  }

  section > a {
    @apply flex items-center gap-2 md:grid;
    @apply md:grid-cols-[5rem_14rem_auto_16.5rem] lg:grid-cols-[5rem_14rem_auto_16.5rem_12rem];
    @apply xl:grid-cols-[5rem_14rem_auto_16.5rem_12rem_17rem_auto] 2xl:grid-cols-[5rem_12.5rem_auto_17rem_12.5rem_18rem_6rem];
    @apply cursor-pointer px-8 py-6 transition-colors duration-300 ease-in-out hover:bg-neutral-300/10;
  }

  a > img {
    @apply h-14 w-14 rounded-full border-2 border-neutral-200 shadow-inner;
  }

  p {
    @apply inline-flex items-center gap-2 text-neutral-400;
  }

  a > p {
    @apply max-xl:hidden;
  }
</style>
