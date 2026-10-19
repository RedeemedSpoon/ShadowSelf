<script lang="ts">
  import {goto} from '$app/navigation';
  import {page} from '$app/state';
  import type {Snippet} from 'svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Status from '$component/ui/Status.svelte';
  import brand from '$image/brands/shadowself/icon.svg';

  let {user, children}: {user: string; children: Snippet} = $props();
  let signOutPending = $state(false);
  let signOutError = $state('');
  const links = [
    {href: '/dashboard', label: 'Identities', icon: 'identities'},
    {href: '/settings', label: 'Account settings', icon: 'settings'},
    {href: '/docs', label: 'API reference', icon: 'code'},
    {href: '/extension', label: 'Browser extension', icon: 'shield'},
  ];

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
    <a class="console-brand" href="/"
      ><img src={brand} alt="" /><span>ShadowSelf<small>IDENTITY CONSOLE</small></span></a>
    <nav aria-label="Application navigation">
      {#each links as link (link.href)}<a
          href={link.href}
          class:active={page.url.pathname.startsWith(link.href)}
          aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
          ><Icon name={link.icon} />{link.label}</a
        >{/each}
    </nav>
    <div class="sidebar-bottom">
      <span class="account-name"><Icon name="user" />{user}</span>
      <form action="/logout" method="POST" onsubmit={signOut} aria-busy={signOutPending}>
        <button class="control-button quiet" type="submit" disabled={signOutPending}>
          <Icon name="logout" size={17} />{signOutPending ? 'Signing out…' : 'Sign out'}
        </button>
      </form>
      <Status message={signOutError} kind="error" />
    </div>
  </aside>
  <main id="main-content" class="console-main">{@render children()}</main>
</div>
