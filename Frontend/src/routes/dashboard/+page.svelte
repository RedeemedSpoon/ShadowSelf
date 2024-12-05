<script lang="ts">
  import {LogoutIcon, IssuesIcon, ChangelogIcon, CommunityIcon, FilterIcon, SortIcon} from '$icon';
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

  const keyword = data.identities;
  function handleSearch(result: string[]) {}
</script>

<svelte:head>
  <title>ShadowSelf - Dashboard</title>
  <meta name="description" content="Use our dashboard to control your ShadowSelf identities and manage your online privacy" />
</svelte:head>

<div id="dashboard">
  <div class="m-8">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-4xl text-neutral-300">Welcome back, <span class="pretty-style">{$user}</span></h1>
      <div class="flex items-center">
        <button class="px-0"><FilterIcon /></button>
        <button><SortIcon /></button>
        <SearchInput {handleSearch} {keyword} />
      </div>
    </div>
    <div class="mt-16 flex justify-center gap-8">
      {#each data.identities as identity}
        <div class="flex flex-col gap-2">
          <p>{identity.name}</p>
          <p>{identity.email}</p>
          <p>{identity.phone}</p>
        </div>
      {/each}
    </div>
  </div>
  <hr class="h-px border-0 bg-neutral-500" />
  <div class="-my-8 mx-6 flex justify-between">
    <a href="/logout"> <button><LogoutIcon />Logout</button> </a>
    <div class="flex gap-3">
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
</style>
