<script lang="ts">
  import {tick} from 'svelte';
  import {SERVICE_GUIDES} from '$constant';
  import {API_DOCUMENTATION, API_KEY_TEST_DOCUMENTATION} from '$lib/constants/api-documentation';
  import Dialog from '$component/ui/Dialog.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import ApiMethod from './ApiMethod.svelte';

  let {onselect}: {onselect: (sectionId: string, endpointId?: string) => Promise<void>} = $props();
  let open = $state(false);
  let query = $state('');
  let input = $state<HTMLInputElement>();
  let results = $state<HTMLDivElement>();
  let canScrollUp = $state(false);
  let canScrollDown = $state(false);
  const groups = $derived.by(() => {
    const term = query.toLowerCase().trim();

    return [API_KEY_TEST_DOCUMENTATION, ...API_DOCUMENTATION]
      .map((group) => {
        const guide = group.guide ? SERVICE_GUIDES[group.guide] : null;
        const searchableText = [group.title, guide?.title, guide?.introduction];

        if (guide) {
          searchableText.push(...guide.tools.flatMap((tool) => [tool.name, tool.description]));
        }

        const matchesGroup = searchableText.join(' ').toLowerCase().includes(term);
        const endpoints = group.endpoints
          .map((endpoint, index) => ({...endpoint, id: `${group.id}-endpoint-${index}`}))
          .filter(
            (endpoint) =>
              matchesGroup || `${endpoint.method} ${endpoint.path} ${endpoint.detail}`.toLowerCase().includes(term),
          );

        return {...group, endpoints, matchesGroup};
      })
      .filter((group) => group.matchesGroup || group.endpoints.length);
  });
  const endpointCount = $derived(groups.reduce((total, group) => total + group.endpoints.length, 0));

  function toggleSearch() {
    if (!open) {
      query = '';
    }

    open = !open;
  }

  function updateOverflow() {
    if (!results) {
      return;
    }

    canScrollUp = results.scrollTop > 2;
    canScrollDown = results.scrollTop + results.clientHeight < results.scrollHeight - 2;
  }

  async function selectResult(sectionId: string, endpointId?: string) {
    open = false;
    await tick();
    await onselect(sectionId, endpointId);
  }

  function moveResultFocus(event: KeyboardEvent) {
    if (!results || !['ArrowDown', 'ArrowUp'].includes(event.key)) {
      return;
    }

    const buttons = [...results.querySelectorAll<HTMLButtonElement>('[data-search-result]')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);

    if (current < 0 && document.activeElement !== input) {
      return;
    }

    event.preventDefault();

    const next = event.key === 'ArrowDown' ? current + 1 : current - 1;

    if (next < 0) {
      input?.focus();
    } else {
      buttons[Math.min(next, buttons.length - 1)]?.focus();
    }
  }

  $effect(() => {
    if (open) {
      void tick().then(() => input?.focus());
    }
  });

  $effect(() => {
    if (!open || !results) {
      return;
    }

    void groups;

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(results);

    if (results.firstElementChild) {
      observer.observe(results.firstElementChild);
    }

    results.scrollTop = 0;
    updateOverflow();

    return () => observer.disconnect();
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggleSearch();
    } else if (open) {
      moveResultFocus(event);
    }
  }} />

<button
  class="search-trigger"
  aria-label="Search the API reference"
  aria-haspopup="dialog"
  aria-expanded={open}
  aria-keyshortcuts="Control+K"
  onclick={toggleSearch}>
  <Icon name="search" size={15} /><span>Search</span><kbd>Ctrl + K</kbd>
</button>

<Dialog bind:open title="Search the API reference">
  <div class="search-input">
    <Icon name="search" size={17} />
    <input
      type="search"
      aria-label="Search sections and API calls"
      placeholder="Service, method, or endpoint"
      bind:value={query}
      bind:this={input} />
  </div>
  <p class="result-count" role="status" aria-live="polite" aria-atomic="true">
    {endpointCount}
    {endpointCount === 1 ? 'endpoint' : 'endpoints'} in {groups.length}
    {groups.length === 1 ? 'section' : 'sections'}
  </p>
  <div class="results-frame" class:has-earlier={canScrollUp}>
    <div class="search-results" bind:this={results} onscroll={updateOverflow}>
      <ul class="result-groups" aria-label="API search results">
        {#each groups as group (group.id)}
          <li class="result-group" data-feature={group.feature}>
            <button class="group-heading" data-search-result onclick={() => selectResult(group.id)}>
              <Icon name={group.icon} size={17} /><span>{group.title}</span><small>{group.endpoints.length}</small>
            </button>
            {#if group.endpoints.length}
              <ul class="endpoint-tree">
                {#each group.endpoints as endpoint (endpoint.id)}
                  <li>
                    <button
                      class="endpoint-result"
                      data-search-result
                      onclick={() => selectResult(group.id, endpoint.id)}>
                      <code>{endpoint.path}</code><ApiMethod method={endpoint.method} />
                    </button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="no-endpoints">No API endpoints documented.</p>
            {/if}
          </li>
        {/each}
      </ul>
      {#if !groups.length}
        <div class="empty-results">
          <Icon name="search" size={25} />
          <p>No matching sections or API calls.</p>
          <small>Try a service name, method, or path.</small>
        </div>
      {/if}
    </div>
    <div class="more-results" class:visible={canScrollDown} aria-hidden={!canScrollDown} inert={!canScrollDown}>
      <button onclick={() => results?.scrollBy({top: results.clientHeight * 0.7, behavior: 'smooth'})}>
        More results<Icon name="chevron" size={13} />
      </button>
    </div>
  </div>
</Dialog>

<style>
  .search-trigger {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 9px 10px;
    margin-bottom: 20px;
    border: 1px solid var(--line);
    border-radius: 5px;
    background: transparent;
    color: #94a3c2;
    font-size: 11px;
    line-height: 1.7;
    text-align: left;
    transition:
      background-color 180ms ease,
      border-color 180ms ease,
      color 180ms ease,
      box-shadow 180ms ease;
  }
  .search-trigger:is(:hover, :focus-visible, [aria-expanded='true']) {
    border-color: color-mix(in srgb, var(--accent-light) 22%, transparent);
    background: var(--neutral-hover);
    color: #dce3f7;
  }
  .search-trigger:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 65%, transparent);
  }
  .search-trigger:active {
    background: var(--neutral-pressed);
    color: #e6ebff;
  }
  .search-trigger kbd {
    margin-left: auto;
    color: #667796;
    font:
      400 9px 'Fira Code Variable',
      monospace;
    white-space: nowrap;
  }
  .search-input {
    position: relative;
  }
  .search-input > :global(svg) {
    position: absolute;
    top: 50%;
    left: 12px;
    translate: 0 -50%;
    color: var(--muted);
  }
  .search-input input {
    padding-left: 38px;
  }
  .result-count {
    margin: 12px 0 14px;
    color: var(--muted);
    font-size: 10px;
  }
  .results-frame {
    position: relative;
  }
  .results-frame::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    z-index: 1;
    height: 20px;
    background: linear-gradient(var(--surface), transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 180ms ease;
  }
  .results-frame.has-earlier::before {
    opacity: 1;
  }
  .search-results {
    max-height: min(55dvh, 480px, calc(100dvh - 240px));
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }
  .search-results::-webkit-scrollbar {
    display: none;
  }
  .result-groups,
  .endpoint-tree {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .result-group,
  .endpoint-tree > li {
    margin: 0;
  }
  .result-group + .result-group {
    margin-top: 14px;
  }
  .group-heading,
  .endpoint-result {
    width: 100%;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: #c2cce5;
    text-align: left;
    cursor: pointer;
  }
  .group-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 8px;
    font-size: 12px;
  }
  .group-heading > :global(svg) {
    flex-shrink: 0;
    color: var(--feature-accent);
  }
  .group-heading small {
    margin-left: auto;
    color: var(--feature-accent);
    font:
      10px 'Fira Code Variable',
      monospace;
  }
  .endpoint-tree {
    margin-left: 16px;
    padding-left: 14px;
  }
  .endpoint-tree > li {
    position: relative;
  }
  .endpoint-tree > li::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -14px;
    width: 1px;
    background: color-mix(in srgb, var(--feature-accent) 23%, transparent);
  }
  .endpoint-tree > li:last-child::after {
    bottom: auto;
    height: 22px;
  }
  .endpoint-tree > li::before {
    content: '';
    position: absolute;
    top: 22px;
    left: -14px;
    width: 10px;
    height: 1px;
    background: color-mix(in srgb, var(--feature-accent) 23%, transparent);
  }
  .endpoint-result {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
    padding: 10px 8px;
  }
  .endpoint-result code {
    padding-block: 3px;
    color: #b5c3db;
    font:
      10px 'Fira Code Variable',
      monospace;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .group-heading:is(:hover, :focus-visible),
  .endpoint-result:is(:hover, :focus-visible) {
    outline: none;
    background: var(--neutral-hover);
    color: #e6ebff;
  }
  .group-heading:focus-visible,
  .endpoint-result:focus-visible {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 65%, transparent);
  }
  .group-heading:active,
  .endpoint-result:active {
    background: var(--neutral-pressed);
  }
  .no-endpoints {
    margin: 0 8px 10px 44px;
    color: var(--muted);
    font-size: 10px;
  }
  .more-results {
    position: absolute;
    inset: auto 0 0;
    z-index: 2;
    display: flex;
    justify-content: center;
    padding-top: 18px;
    background: linear-gradient(transparent, var(--surface) 45%);
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 180ms ease,
      visibility 0s linear 180ms;
  }
  .more-results.visible {
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }
  .more-results button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: 1px solid var(--line);
    border-radius: 5px;
    color: var(--muted);
    background: var(--surface);
    font-size: 10px;
    pointer-events: none;
  }
  .more-results.visible button {
    pointer-events: auto;
  }
  .more-results button:hover {
    color: #e6ebff;
    background: #192236;
  }
  .empty-results {
    padding: 28px 10px;
    text-align: center;
    color: var(--muted);
  }
  .empty-results > :global(svg) {
    margin-inline: auto;
  }
  .empty-results p {
    margin: 15px 0 8px;
    font-size: 12px;
  }
  .empty-results small {
    font-size: 10px;
  }
  @media (prefers-reduced-motion: reduce) {
    .search-trigger,
    .more-results,
    .results-frame::before {
      transition: none;
    }
  }
  @media (max-width: 900px) {
    .search-trigger {
      margin-bottom: 10px;
    }
  }
  @media (max-width: 450px) {
    .endpoint-result {
      gap: 8px;
      padding-inline: 5px;
    }
    .group-heading {
      padding-inline: 5px;
      font-size: 11px;
    }
    .endpoint-tree {
      margin-left: 13px;
      padding-left: 11px;
    }
    .endpoint-tree > li::after {
      left: -11px;
    }
    .endpoint-tree > li::before {
      left: -11px;
      width: 8px;
    }
  }
</style>
