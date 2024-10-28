<script lang="ts">
  import {authenticated, scrollY} from '$store';
  import {logoBesideText} from '$images';
  import {page} from '$app/stores';

  $: isHome = $page.url.pathname === '/';
  $: shouldFocus = isHome && $scrollY < 150;
</script>

<svelte:window bind:scrollY={$scrollY} />
<header class:focused={shouldFocus}>
  <a href="/">
    <img id="logo" src={logoBesideText} alt="App" width="256px" />
  </a>
  <div class="flex gap-4">
    <div id="navigation-links">
      <a href="/extension">Extension</a>
      <a href="/purchase">Purchase</a>
      <a href="/docs">Docs</a>
    </div>
    <div id="auth-buttons">
      {#if $authenticated}
        <a href="/dashboard">Account Name</a>
      {:else}
        <a class="text-primary-700 hover:text-primary-800 underline" href="/login">Log In</a>
        <a href="/signup"><button>Sign Up</button></a>
      {/if}
    </div>
  </div>
</header>

<style lang="postcss">
  header {
    @apply fixed top-0 z-50 flex h-24 w-full items-center justify-evenly bg-neutral-950 bg-opacity-75 px-24 py-4 backdrop-blur-md;
    @apply transition-all duration-1000 ease-in-out;
  }

  #logo {
    @apply transition-transform duration-1000 ease-in-out;
  }

  #auth-buttons,
  #navigation-links {
    @apply flex items-center gap-8 text-xl transition-transform duration-1000 ease-in-out;
  }

  #auth-buttons {
    @apply border-l border-neutral-700 px-8;
  }

  .focused {
    @apply bg-transparent backdrop-blur-none;
  }

  .focused #auth-buttons,
  .focused #navigation-links {
    @apply translate-x-40;
  }

  .focused #logo {
    @apply -translate-x-40;
  }
</style>
