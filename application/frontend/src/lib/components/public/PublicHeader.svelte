<script lang="ts">
  import logo from '$image/brands/shadowself/logo-beside-text.svg';
  import {page} from '$app/state';
  import Icon from '$component/ui/Icon.svelte';

  let {signedIn = false}: {signedIn?: boolean} = $props();
  let expanded = $state(false);
  let menuButton: HTMLButtonElement;

  function closeWithEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !expanded) {
      return;
    }

    expanded = false;
    menuButton.focus();
  }

  const links = [
    {href: '/purchase', label: 'Purchase'},
    {href: '/extension', label: 'Extension'},
    {href: '/docs', label: 'Docs'},
  ];
</script>

<svelte:window onkeydown={closeWithEscape} />

<header class="public-header">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="ShadowSelf home"
      ><img src={logo} alt="ShadowSelf" width="180" height="40" /></a>
    <button
      class="menu-toggle"
      bind:this={menuButton}
      type="button"
      aria-label={expanded ? 'Close navigation' : 'Open navigation'}
      aria-expanded={expanded}
      aria-controls="public-navigation"
      onclick={() => (expanded = !expanded)}><span></span><span></span></button>
    <nav id="public-navigation" class:expanded aria-label="Main navigation">
      {#each links as link (link.href)}<a
          href={link.href}
          aria-current={page.url.pathname === link.href ? 'page' : undefined}
          onclick={() => (expanded = false)}>{link.label}</a
        >{/each}
      <div class="account-links">
        {#if signedIn}<div class="signed-in-links">
            <a class="settings-link" href="/settings" aria-label="Account settings" onclick={() => (expanded = false)}
              ><Icon name="settings" size={19} /></a>
            <a class="dashboard-link" href="/dashboard" onclick={() => (expanded = false)}>Dashboard</a>
          </div>
        {:else}<a class="sign-in" href="/login" onclick={() => (expanded = false)}>Log in</a><a
            class="header-action"
            href="/signup"
            onclick={() => (expanded = false)}>Create account</a
          >{/if}
      </div>
    </nav>
  </div>
</header>

<style>
  .public-header {
    position: sticky;
    top: 0;
    z-index: 30;
    flex-shrink: 0;
    background: #060a16;
    border-bottom: 1px solid #64748b26;
    box-shadow: 0 4px 24px #02040a20;
    color: #cad3ec;
  }
  .header-inner {
    width: min(1100px, calc(100% - 80px));
    min-height: var(--public-header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    margin: auto;
  }
  .brand {
    display: block;
    flex-shrink: 0;
  }
  .brand img {
    display: block;
    width: 180px;
    height: auto;
  }
  nav {
    display: flex;
    align-items: center;
    gap: 30px;
  }
  a {
    text-decoration: none;
    font-size: 13px;
    color: inherit;
    transition:
      color 180ms ease,
      background 180ms ease,
      transform 180ms ease,
      box-shadow 180ms ease;
  }
  a:hover {
    color: #fff;
  }
  .account-links {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-left: 28px;
    border-left: 1px solid #a5b4fc25;
  }
  .header-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 17px;
    background: linear-gradient(135deg, #6253ec, #4938c9);
    border: 1px solid #a298ff70;
    border-radius: 7px;
    color: #f3f0ff;
    box-shadow:
      inset 0 1px #ffffff15,
      0 4px 16px #4235b024;
  }
  .header-action:hover {
    background: linear-gradient(135deg, #7163f5, #5947d8);
    box-shadow: 0 6px 24px #6253ec30;
  }
  .sign-in {
    color: #a5a7ff;
  }
  .settings-link {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    color: #818cf8;
  }
  .signed-in-links {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #818cf8;
  }
  .dashboard-link {
    position: relative;
    padding-block: 8px;
    color: #818cf8;
  }
  .dashboard-link::after {
    content: '';
    position: absolute;
    inset: auto 0 2px;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 240ms ease;
  }
  .dashboard-link:hover,
  .settings-link:hover {
    color: #818cf8;
  }
  .dashboard-link:hover::after,
  .dashboard-link:focus-visible::after {
    transform: scaleX(1);
  }
  .settings-link :global(svg) {
    fill: transparent;
    transition:
      fill 260ms ease,
      transform 260ms ease;
  }
  .settings-link:hover :global(svg),
  .settings-link:focus-visible :global(svg) {
    fill: currentColor;
    transform: rotate(20deg);
  }
  .menu-toggle {
    display: none;
    background: transparent;
    color: #d7dff4;
    border: 1px solid #a5b4fc35;
    width: 42px;
    height: 42px;
    padding: 12px;
    border-radius: 7px;
    cursor: pointer;
    box-shadow: none;
  }
  .menu-toggle span {
    display: block;
    height: 1px;
    margin: 5px 0;
    background: currentColor;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 2px solid #b7a9ff;
    outline-offset: 5px;
  }
  @media (max-width: 1050px) {
    .header-inner {
      width: calc(100% - 48px);
    }
    nav {
      gap: 20px;
    }
    .account-links {
      gap: 18px;
      padding-left: 20px;
    }
  }
  @media (max-width: 800px) {
    .header-inner {
      width: calc(100% - 40px);
    }
    .brand img {
      width: 156px;
    }
    .menu-toggle {
      display: block;
    }
    nav {
      display: none;
      position: absolute;
      left: 20px;
      right: 20px;
      top: calc(100% + 8px);
      max-height: calc(100dvh - var(--public-header-height) - 24px);
      overflow-y: auto;
      padding: 20px;
      background: #10172cf5;
      border: 1px solid #a5b4fc30;
      border-radius: 9px;
      box-shadow: 0 20px 50px #0006;
    }
    nav.expanded {
      display: grid;
      gap: 4px;
    }
    nav > a {
      padding: 12px 0;
      font-size: 14px;
    }
    .account-links {
      border-left: 0;
      border-top: 1px solid #a5b4fc25;
      margin-top: 12px;
      padding: 18px 0 0;
      justify-content: space-between;
    }
  }
</style>
