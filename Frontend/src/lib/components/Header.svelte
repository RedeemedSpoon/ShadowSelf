<script lang="ts">
  import {authenticated, scrollY} from '$store';
  import {HamburgerMenu} from '$components';
  import {logoBesideText} from '$images';
  import {page} from '$app/stores';

  $: isHome = $page.url.pathname === '/';
  $: shouldFocus = isHome && $scrollY < 150;
</script>

<svelte:window bind:scrollY={$scrollY} />
<header class:focused={shouldFocus}>
  <a href="/">
    <img id="logo" src={logoBesideText} alt="Shadowself Logo" />
  </a>
  <div id="nav-container" class="translate-x-0 transition-transform duration-1000 ease-in-out">
    <HamburgerMenu className="!w-16 !h-16">
      <div id="navigation-links">
        <a href="/extension">Extension</a>
        <a href="/purchase">Purchase</a>
        <a href="/docs">Docs</a>
      </div>
      <div id="auth-buttons">
        {#if $authenticated}
          <a href="/dashboard">Account Name</a>
        {:else}
          <a class="text-primary-600 hover:text-primary-700 underline max-xl:mr-2" href="/login">Log In</a>
          <a href="/signup"><button>Sign Up</button></a>
        {/if}
      </div>
    </HamburgerMenu>
  </div>
</header>

<style lang="postcss">
  header {
    @apply fixed top-0 z-50 flex w-full items-center justify-evenly bg-neutral-950 bg-opacity-75 py-4 backdrop-blur-md md:px-20;
    @apply transition-all duration-1000 ease-in-out;
  }

  #logo {
    @apply min-h-[3rem] transition-transform duration-1000 ease-in-out md:min-h-[3.75rem];
  }

  #auth-buttons,
  #navigation-links {
    @apply flex items-center gap-4 text-nowrap text-xl xl:gap-8;
  }

  #auth-buttons {
    @apply border-neutral-700 px-8 max-md:flex-row-reverse max-md:border-b max-md:pb-6 md:border-l;
  }

  .focused {
    @apply bg-transparent backdrop-blur-none;
    & #nav-container {
      @apply translate-x-[8.5vw];
    }

    & #logo {
      @apply -translate-x-[8.5vw];
    }
  }
</style>
