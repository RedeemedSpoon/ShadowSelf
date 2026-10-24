<script lang="ts">
  import {invalidateAll} from '$app/navigation';
  import type {PageData} from './$types';
  import Button from '$component/ui/Button.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Status from '$component/ui/Status.svelte';
  import Select from '$component/ui/Select.svelte';
  import {formatPhoneNumber} from '$utils/formatting';

  let {data}: {data: PageData} = $props();
  let query = $state('');
  let status = $state('all');
  let sort = $state('newest');
  let pending = $state(false);
  let recoveryDismissed = $state(false);
  const visible = $derived.by(() => {
    const found = data.identities.filter(
      (identity) =>
        (status === 'all' || identity.status === status) &&
        [identity.name, identity.id, identity.location, identity.country, identity.email, identity.phone]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
    );

    const ordered =
      sort === 'name'
        ? found.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        : sort === 'newest'
          ? found
          : [...found].reverse();

    return ordered.sort((a, b) => Number(a.status === 'inactive') - Number(b.status === 'inactive'));
  });

  async function reload() {
    pending = true;

    try {
      await invalidateAll();
    } finally {
      pending = false;
    }
  }
</script>

<svelte:head><title>Identities | ShadowSelf</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Identities</h1>
  </div>
  <a class="control-button primary" href="/purchase"><Icon name="plus" size={17} />New identity</a>
</div>
{#if data.recoveryRemaining === 0 && !recoveryDismissed}<Status
    message="No recovery codes remain. Generate new codes in account settings."
    ondismiss={() => (recoveryDismissed = true)} />{/if}
{#if data.loadError}<Status message={data.loadError} kind="error" /><Button
    variant="secondary"
    icon="refresh"
    loading={pending}
    onclick={reload}>Retry loading identities</Button>
{:else if !data.identities.length}<div class="empty-state">
    <Icon name="identities" size={42} />
    <h2>No identities</h2>
    <a class="control-button primary" href="/purchase"><Icon name="plus" size={17} />Create an identity</a>
  </div>
{:else}
  <div class="identity-toolbar">
    <div class="search-field">
      <Icon name="search" size={17} /><input
        type="search"
        aria-label="Search identities"
        bind:value={query}
        placeholder="Search names, emails or locations" />
    </div>
    <div class="toolbar-select">
      <Select
        id="identity-status"
        label="Filter identity status"
        compact
        bind:value={status}
        options={[
          {value: 'all', label: 'All statuses'},
          {value: 'active', label: 'Active'},
          {value: 'inactive', label: 'Setup pending'},
          {value: 'frozen', label: 'Frozen'},
        ]} />
    </div>
    <div class="toolbar-select">
      <Select
        id="identity-sort"
        label="Sort identities"
        compact
        bind:value={sort}
        options={[
          {value: 'newest', label: 'Newest first'},
          {value: 'oldest', label: 'Oldest first'},
          {value: 'name', label: 'Name'},
        ]} />
    </div>
  </div>
  <div class="identity-list">
    {#each visible as identity (identity.id)}<a
        class="identity-card"
        class:unfinished={identity.status === 'inactive'}
        href={identity.status === 'inactive' ? `/create?id=${identity.id}` : `/identity/${identity.id}`}
        ><div class="identity-avatar">
          {#if identity.picture}<img src="data:image/png;base64,{identity.picture}" alt="" />{:else}<Icon
              name="user"
              size={25} />{/if}
        </div>
        <div class="identity-title">
          <h2>{identity.name || 'Continue identity setup'}</h2>
          <small>{identity.location || 'Profile not configured'}</small>
        </div>
        <span class="badge {identity.status}"
          >{identity.status === 'inactive' ? 'Setup pending' : identity.status}</span>
        {#if identity.status !== 'inactive'}
          <div class="identity-contacts">
            <span class="identity-detail"
              ><Icon name="mail" size={16} /><span>{identity.email || 'Mailbox pending'}</span></span>
            <span class="identity-detail"
              ><Icon name="phone" size={16} /><span
                >{identity.phone ? formatPhoneNumber(identity.phone) : 'Number pending'}</span
              ></span>
          </div>
          <div class="identity-count">
            <span>{identity.accounts || 0} vault entries</span>
          </div>
          <Icon name="arrow" size={17} />
        {/if}</a
      >{/each}
  </div>
  {#if !visible.length}<div class="empty-state">
      <Icon name="search" size={35} />
      <h2>No matching identities</h2>
      <Button
        variant="secondary"
        onclick={() => {
          query = '';
          status = 'all';
        }}>Clear filters</Button>
    </div>{/if}
{/if}

<style>
  .identity-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .toolbar-select {
    width: 155px;
  }
  .search-field {
    position: relative;
    flex: 1;
  }
  .search-field > :global(svg) {
    position: absolute;
    top: 13px;
    left: 13px;
    color: #687792;
  }
  .search-field input {
    padding-left: 39px !important;
  }
  .identity-list {
    display: grid;
    gap: 12px;
  }
  .identity-card {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto 20px;
    align-items: center;
    gap: 7px 16px;
    padding: 17px 20px;
    border: 1px solid color-mix(in srgb, var(--accent-light) 12.55%, transparent);
    border-radius: 7px;
    background: linear-gradient(110deg, #111a2c, #0d1425);
    transition: border-color 140ms;
  }
  .identity-card:hover {
    border-color: #9384e55a;
  }
  .identity-card.unfinished {
    grid-template-columns: 42px minmax(0, 1fr) auto;
    border-style: dashed;
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    background: transparent;
    opacity: 0.58;
    transition:
      border-color 200ms ease,
      opacity 200ms ease;
  }
  .identity-card.unfinished:hover,
  .identity-card.unfinished:focus-visible {
    opacity: 0.8;
  }
  .unfinished .identity-avatar {
    grid-row: 1;
    border-style: dashed;
  }
  .identity-avatar {
    grid-row: 1/3;
    width: 42px;
    height: 42px;
    background: #6553e316;
    border: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: var(--accent);
    overflow: hidden;
  }
  .identity-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .identity-title h2 {
    font-size: 16px;
  }
  .identity-title small {
    display: block;
    margin-top: 4px;
  }
  .identity-card > .badge {
    justify-self: end;
  }
  .identity-card > :global(svg) {
    grid-column: 4;
    grid-row: 1/3;
    color: #81749e;
  }
  .identity-contacts {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    min-width: 0;
  }
  .identity-detail {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    font-size: 12px;
    color: #a7b3cf;
    overflow-wrap: anywhere;
  }
  .identity-detail :global(svg) {
    flex-shrink: 0;
  }
  .identity-count {
    grid-column: 3;
    grid-row: 2;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px 18px;
    color: #7a89a5;
    font-size: 11px;
    max-width: 220px;
  }
  @media (max-width: 650px) {
    .identity-toolbar {
      flex-wrap: wrap;
    }
    .search-field {
      flex-basis: 100%;
    }
    .toolbar-select {
      flex: 1;
      min-width: 0;
    }
    .identity-card {
      grid-template-columns: 42px 1fr auto;
      padding: 17px;
      gap: 9px 12px;
    }
    .identity-avatar {
      width: 42px;
      height: 42px;
      grid-row: 1/2;
    }
    .identity-card > .badge {
      font-size: 9px;
    }
    .identity-card > :global(svg) {
      display: none;
    }
    .identity-title h2 {
      font-size: 14px;
    }
    .identity-contacts {
      grid-column: 1/4;
      grid-row: auto;
    }
    .identity-count {
      grid-column: 1/4;
      grid-row: auto;
      justify-content: flex-start;
      max-width: none;
      margin-top: 3px;
    }
  }
</style>
