<script lang="ts">
  import {logo, github, tor, simplex} from '$images';
  import {notify} from '$lib';

  const year = new Date().getFullYear();
  const links = {
    Product: ['Homepage', 'Extension', 'Pricing'],
    Account: ['Dashboard', 'Settings', 'Docs'],
    Support: ['Contact', 'About', 'FAQ'],
    Legal: ['Terms of Service', 'Privacy Policy'],
  };
</script>

<footer>
  <div>
    <div id="logo">
      <a href="/"><img src={logo} alt="ShadowSelf" width="216" height="216" /></a>
      <div class="flex justify-center gap-4">
        <a href="https://github.com/RedeemedSpoon/ShadowSelf"><img src={github} alt="Source Code" /></a>
        <a href="/" on:click|preventDefault={() => notify('Onion Website Coming Soon!', 'info')}>
          <img src={tor} alt="Onion Website" />
        </a>
        <a href="/" on:click|preventDefault={() => notify('SimpleX Community Coming Soon!', 'info')}>
          <img src={simplex} alt="SimpleX Community" />
        </a>
      </div>
    </div>
    <nav class="flex justify-end gap-24 px-16">
      {#each Object.entries(links) as [key, value]}
        <div class="flex flex-col gap-6">
          <p class="font-bold text-neutral-400">{key}</p>
          {#each value as link}
            {@const url = link === 'Homepage' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`}
            <a class="alt" href={url}>{link}</a>
          {/each}
        </div>
      {/each}
    </nav>
  </div>
  <p>&copy; {year} - ShadowSelf. All rights reserved</p>
</footer>

<style lang="postcss">
  footer {
    @apply sticky z-50 flex w-full flex-col bg-neutral-950 bg-opacity-75 pt-24;
  }

  footer > div {
    @apply mx-auto flex items-center gap-16 px-4;
  }

  #logo {
    @apply flex flex-col items-center gap-6;
  }

  #logo > div img {
    @apply w-6 hover:brightness-125;
  }

  footer > p {
    @apply mb-8 mt-24 w-full text-center text-sm text-neutral-500;
  }
</style>
