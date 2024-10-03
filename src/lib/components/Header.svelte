<script lang="ts">
  import {logoBeside} from '$lib';
  import {getContext} from 'svelte';
  import type {Writable} from 'svelte/store';

  const authenticated: Writable<boolean> = getContext('auth');
</script>

<header>
  <a href="/">
    <img src={logoBeside} alt="App" width="256px" />
  </a>
  <div>
    <div id="navigation-links">
      <a href="/">Extension</a>
      <a href="/">Pricing</a>
      <a href="/">Docs</a>
    </div>
    <div id="auth-buttons">
      {#if $authenticated}
        <a href="/">Account Name</a>
      {:else}
        <a href="/">Log In</a>
        <a href="/"><button>Sign Up</button></a>
      {/if}
    </div>
  </div>
</header>

<style lang="postcss">
  header {
    @apply fixed top-0 z-10 flex h-24 w-full items-center justify-evenly bg-neutral-950 bg-opacity-75 py-4 backdrop-blur-md;
  }

  header > div {
    @apply flex gap-8;
  }

  #auth-buttons,
  #navigation-links {
    @apply flex items-center gap-8 text-xl;
  }

  #auth-buttons {
    @apply border-l border-neutral-700 px-8;
  }

  #navigation-links a {
    @apply text-neutral-400 no-underline transition-colors duration-300 hover:text-neutral-100;
  }
</style>
