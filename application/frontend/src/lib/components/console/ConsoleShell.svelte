<script lang="ts">
  import {goto, invalidate} from '$app/navigation';
  import {slide} from 'svelte/transition';
  import {MediaQuery} from 'svelte/reactivity';
  import type {Identity} from '$type';
  import {page} from '$app/state';
  import {onDestroy, type Snippet} from 'svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Button from '$component/ui/Button.svelte';
  import brand from '$image/brands/shadowself/icon.svg';

  let {
    user,
    identities,
    identitiesError,
    children,
  }: {
    user: string;
    identities: Identity[];
    identitiesError: string;
    children: Snippet;
  } = $props();
  let identitiesOpen = $state(true);
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const selectedIdentity = $derived(page.params.slug || page.url.searchParams.get('id'));
  const navigationIdentities = $derived(
    identities.toSorted((a, b) => Number(a.status === 'inactive') - Number(b.status === 'inactive')),
  );
  let signOutOpen = $state(false);
  let signOutPending = $state(false);
  let signOutError = $state('');
  let extensionPending = $state(false);
  let extensionAttempt: AbortController | undefined;

  onDestroy(() => extensionAttempt?.abort());

  async function openExtension(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    if (extensionPending) {
      return;
    }

    let available = false;
    const receiveAvailability = () => {
      available = true;
    };

    window.addEventListener('shadowself-extension-ready', receiveAvailability);
    window.dispatchEvent(new Event('shadowself-extension-probe'));
    window.removeEventListener('shadowself-extension-ready', receiveAvailability);

    if (!available) {
      await goto('/extension');

      return;
    }

    extensionPending = true;
    const controller = new AbortController();
    extensionAttempt = controller;
    const requestID = crypto.randomUUID();

    const opened = await new Promise<boolean>((resolve) => {
      const cancel = () => finish(false);
      const finish = (success: boolean) => {
        clearTimeout(timeout);
        window.removeEventListener('message', receive);
        controller.signal.removeEventListener('abort', cancel);
        resolve(success);
      };
      const receive = (event: MessageEvent) => {
        if (
          event.source !== window ||
          event.origin !== location.origin ||
          event.data?.source !== 'shadowself-extension' ||
          event.data?.requestID !== requestID
        ) {
          return;
        }

        finish(event.data.opened === true);
      };
      const timeout = window.setTimeout(() => finish(false), 1500);

      controller.signal.addEventListener('abort', cancel, {once: true});
      window.addEventListener('message', receive);
      window.postMessage({source: 'shadowself-website', type: 'open-extension', requestID}, location.origin);
    });

    extensionPending = false;

    if (!opened && !controller.signal.aborted) {
      await goto('/extension');
    }
  }

  async function signOut(event: SubmitEvent) {
    event.preventDefault();

    if (signOutPending) {
      return;
    }

    signOutPending = true;
    signOutError = '';

    try {
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams(),
      });

      if (!response.ok) {
        signOutError =
          response.status === 503
            ? 'Could not revoke this session. Please retry.'
            : 'Could not sign out. Please retry.';

        return;
      }

      await goto('/', {invalidateAll: true});
    } catch {
      signOutError = 'Could not reach the server. Please retry.';
    } finally {
      signOutPending = false;
    }
  }
</script>

<div class="console">
  <aside class="console-sidebar">
    <div class="sidebar-heading">
      <a class="console-brand" href="/dashboard" aria-label="ShadowSelf dashboard">
        <img src={brand} alt="" /><span>Shadow<span class="brand-self">Self</span><small>IDENTITY CONSOLE</small></span>
      </a>
      <a class="homepage-link text-link back-link" href="/"><Icon name="back" size={15} />Back to homepage</a>
    </div>
    <nav aria-label="Application navigation">
      <div class="identity-navigation">
        <div class="identity-navigation-heading">
          <a href="/dashboard" aria-current={page.url.pathname === '/dashboard' ? 'page' : undefined}>
            <Icon name="identities" size={19} />Identities
          </a>
          <button
            type="button"
            aria-label={identitiesOpen ? 'Collapse identities' : 'Expand identities'}
            aria-expanded={identitiesOpen}
            aria-controls="sidebar-identities"
            onclick={() => (identitiesOpen = !identitiesOpen)}>
            <Icon name="chevron" size={15} class={identitiesOpen ? 'expanded-chevron' : ''} />
          </button>
        </div>
        {#if identitiesOpen}
          <div
            id="sidebar-identities"
            class="identity-shortcuts"
            transition:slide={{duration: reducedMotion.current ? 0 : 180}}>
            {#each navigationIdentities as identity (identity.id)}
              <a
                class="identity-shortcut"
                class:unfinished={identity.status === 'inactive'}
                class:active={selectedIdentity === identity.id}
                href={identity.status === 'inactive' ? `/create?id=${identity.id}` : `/identity/${identity.id}`}
                aria-current={selectedIdentity === identity.id ? 'page' : undefined}>
                <span>{identity.name || '[SETUP PENDING]'}</span>
              </a>
            {:else}
              {#if !identitiesError}<a class="identity-shortcut" href="/purchase"
                  ><Icon name="plus" size={14} />Create an identity</a
                >{/if}
            {/each}
            {#if identitiesError}
              <div class="sidebar-load-error">
                <span>Identities could not be loaded.</span>
                <button type="button" onclick={() => invalidate('app:identities')}>Retry</button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      <a class="navigation-link" href="/docs"><Icon name="code" size={19} />Guides &amp; API</a>
      <a class="navigation-link" href="/extension" aria-busy={extensionPending} onclick={openExtension}>
        <Icon name="shield" size={19} />{extensionPending ? 'Opening extension…' : 'Browser extension'}
      </a>
    </nav>
    <div class="sidebar-bottom">
      <a class="account-name" href="/settings" aria-label={`Account settings for ${user}`}>
        <Icon name="account" size={24} /><span>{user}</span>
      </a>
      <button class="navigation-link sign-out" type="button" onclick={() => (signOutOpen = true)}>
        <Icon name="logout" size={19} />Sign out
      </button>
    </div>
  </aside>
  <main id="main-content" class="console-main">{@render children()}</main>
</div>

<Dialog bind:open={signOutOpen} title="Sign out of ShadowSelf">
  <p>Sign out of this browser? Your other active sessions will stay signed in.</p>
  <form action="/logout" method="POST" onsubmit={signOut} aria-busy={signOutPending}>
    <Status message={signOutError} kind="error" />
    <div class="sign-out-actions">
      <Button variant="secondary" onclick={() => (signOutOpen = false)}>Cancel</Button>
      <Button type="submit" variant="danger" loading={signOutPending}>Sign out</Button>
    </div>
  </form>
</Dialog>

<style>
  .console-sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 28px 14px 18px;
    border-right: 1px solid var(--line);
    background: #080e1bcc;
  }
  .sidebar-heading {
    padding: 0 8px 28px;
  }
  .console-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 19px;
    font-weight: 650;
    letter-spacing: -0.5px;
  }
  .console-brand img {
    width: 31px;
    height: 31px;
  }
  .brand-self {
    color: var(--accent-strong);
  }
  .console-brand small {
    display: block;
    margin-top: 5px;
    color: var(--muted);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 1.1px;
  }
  .homepage-link {
    --link-color: var(--muted);
    --link-color-hover: #8996b0;
    --link-color-pressed: #77849d;
    align-self: flex-start;
    margin-top: 12px;
  }
  nav {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 20px;
  }
  .navigation-link,
  .identity-navigation-heading,
  .account-name {
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--muted);
    transition:
      background 160ms ease,
      color 160ms ease,
      border-color 160ms ease;
  }
  .navigation-link,
  .identity-navigation-heading > a,
  .account-name {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    font-size: 12px;
  }
  .navigation-link:hover,
  .account-name:hover,
  .identity-navigation-heading:hover {
    color: #e6ebff;
    background: color-mix(in srgb, currentColor 5.1%, transparent);
  }
  .identity-navigation-heading {
    display: flex;
    align-items: center;
  }
  .identity-navigation-heading > a {
    flex: 1;
    min-width: 0;
  }
  .identity-navigation-heading > button {
    display: grid;
    place-items: center;
    align-self: stretch;
    width: 36px;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: inherit;
  }
  .identity-navigation-heading :global(svg[data-icon='identities']) {
    color: inherit;
  }
  .identity-navigation-heading :global(svg[data-icon='chevron']) {
    transform: rotate(-90deg);
    transition: transform 180ms ease;
  }
  .identity-navigation-heading :global(svg.expanded-chevron) {
    transform: rotate(0deg);
  }
  .identity-shortcuts {
    margin: 7px 0 12px 22px;
    padding-left: 12px;
    padding-right: 5px;
    border-left: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
  }
  .identity-shortcut {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 8px;
    border-radius: 5px;
    color: #8f9dbb;
    font-size: 11px;
    transition:
      background 160ms ease,
      color 160ms ease,
      opacity 200ms ease;
  }
  .identity-shortcut > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .identity-shortcut:hover,
  .identity-shortcut.active {
    background: color-mix(in srgb, currentColor 7.06%, transparent);
    color: var(--accent-light);
  }
  .identity-shortcut.unfinished {
    opacity: 0.6;
  }
  .identity-shortcut.unfinished:hover,
  .identity-shortcut.unfinished:focus-visible,
  .identity-shortcut.unfinished.active {
    opacity: 0.85;
  }
  .sidebar-load-error {
    padding: 8px;
    color: #aab6d1;
    font-size: 11px;
    line-height: 1.7;
  }
  .sidebar-load-error button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
  }
  .sidebar-bottom {
    display: grid;
    gap: 8px;
    margin-top: auto;
    padding-top: 16px;
  }
  .account-name > span:last-child {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .account-name :global(svg[data-icon='account']) {
    flex-shrink: 0;
    color: inherit;
  }
  .account-name :global(.account-person) {
    fill: transparent;
    transition: fill 260ms ease;
  }
  .account-name:hover :global(.account-person),
  .account-name:focus-visible :global(.account-person) {
    fill: currentColor;
  }
  .sign-out {
    width: 100%;
    background: transparent;
    font-weight: 400;
    text-align: left;
  }
  .sign-out-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
  }
  @media (max-width: 760px) {
    .console-sidebar {
      position: relative;
      height: auto;
      padding: 18px;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    .sidebar-heading {
      padding: 0 0 20px;
    }
    .console-brand {
      font-size: 18px;
    }
    .console-brand small {
      display: none;
    }
    .homepage-link {
      margin-top: 8px;
    }
    nav {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding-bottom: 0;
      overflow: visible;
    }
    .identity-navigation {
      grid-column: 1 / -1;
    }
    .identity-shortcuts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-left: 20px;
    }
    .navigation-link {
      padding: 12px 8px;
      font-size: 11px;
    }
    .sidebar-bottom {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 14px;
      padding-top: 12px;
    }
    .account-name {
      flex: 1;
      padding: 10px 8px;
    }
    .sidebar-bottom :global(.status-message) {
      margin: 0;
    }
    .sidebar-bottom .sign-out {
      width: auto;
      padding: 10px 8px;
      font-size: 11px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    :global(.expanded-chevron),
    :global(.account-person),
    :global(svg[data-icon='logout']) {
      transition: none !important;
    }
  }
</style>
