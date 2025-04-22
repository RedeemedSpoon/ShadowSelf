<script lang="ts">
  import {HamburgerMenu} from '$component';
  import {logoBesideText} from '$image';
  import {scrollY, user} from '$store';
  import {page} from '$app/state';
  import {UserIcon} from '$icon';

  let isHome = $derived(page.url.pathname === '/');
  let shouldFocus = $derived(isHome && $scrollY < 150);
  let hoverSettings = $state(false) as boolean;
</script>

<svelte:window bind:scrollY={$scrollY} />
<header class:focused={shouldFocus}>
  <a href="/" class="max-sm:ml-6">
    <img id="logo" src={logoBesideText} alt="Shadowself Logo" width="276" />
  </a>
  <div id="nav-container">
    <HamburgerMenu className="w-16! h-16!">
      <div id="navigation-links" class="xl:mr-4">
        <a href="/extension">Extension</a>
        <a href="/purchase">Purchase</a>
        <a href="/docs">Docs</a>
      </div>
      <div id="auth-buttons">
        {#if $user}
          {@const className = 'fill-transparent  transition-all duration-300 ease-in-out stroke-primary-600 h-6 w-6'}
          {@const events = {onmouseenter: () => (hoverSettings = true), onmouseleave: () => (hoverSettings = false)}}
          <div class="flex items-center gap-2">
            <a href="/settings" {...events} class="border-primary-600 rounded-full border-2 p-1">
              <UserIcon className={className + (hoverSettings ? ' fill-primary-600!' : '')} fill={false} />
            </a>
            {#key $user}
              <a href="/dashboard" class="group" id="username">{$user}<span></span></a>
            {/key}
          </div>
        {:else}
          <a class="text-primary-600 hover:text-primary-700 underline max-xl:mr-2" href="/login">Log In</a>
          <a href="/signup"><button class="px-5 py-3">Sign Up</button></a>
        {/if}
      </div>
    </HamburgerMenu>
  </div>
</header>

<style lang="postcss">
  @reference "$style";

  header {
    @apply fixed top-0 z-50 flex w-full items-center justify-evenly py-4 backdrop-blur-md md:px-20;
    @apply select-none bg-neutral-950/75 transition-all duration-1000 ease-in-out;
  }

  #nav-container {
    @apply translate-x-0 transition-transform duration-1000 ease-in-out;
  }

  #username {
    @apply text-primary-600 cursor-pointer font-semibold;
  }

  span {
    @apply basic-style block h-[2px] max-w-0 transition-all duration-300 ease-in-out group-hover:!max-w-full;
  }

  #logo {
    @apply transition-transform duration-1000 ease-in-out max-sm:h-12;
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
      @apply sm:translate-x-[8.5vw];
    }

    & #logo {
      @apply sm:-translate-x-[8.5vw];
    }
  }
</style>
