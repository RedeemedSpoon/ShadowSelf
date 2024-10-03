<script lang="ts">
  import {logo} from '$lib';
  import {github} from '$lib';
  import {session} from '$lib';
  import {tor} from '$lib';

  const year = new Date().getFullYear();
  const links = {
    Product: ['Homepage', 'Extension', 'Pricing'],
    Account: ['Dashboard', 'Settings', 'Docs'],
    Support: ['Contact', 'About', 'FAQ'],
    Legal: ['Terms of Service', 'Privacy Policy'],
  };
</script>

<footer>
  <section>
    <div id="logo">
      <a href="/"><img src={logo} alt="ShadowSelf" width="216" height="216" /></a>
      <div>
        <a href="https://github.com/RedeemedSpoon/ShadowSelf"><img src={github} alt="Source Code" /></a>
        <a href="/"><img src={tor} alt="Onion Website" /></a>
        <a href="/"><img src={session} alt="Session Community" /></a>
      </div>
    </div>
    <nav>
      {#each Object.entries(links) as [key, value]}
        <div>
          <p>{key}</p>
          {#each value as link}
            {@const url = link === 'Homepage' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`}
            <a href={url}>{link}</a>
          {/each}
        </div>
      {/each}
    </nav>
  </section>
  <p>&copy; {year} - ShadowSelf. All rights reserved</p>
</footer>

<style lang="postcss">
  footer {
    @apply sticky flex w-full flex-col bg-neutral-950 bg-opacity-75 pt-24;
  }

  section {
    @apply mx-auto flex items-center gap-16 px-4;
  }

  #logo {
    @apply flex flex-col items-center gap-6;
  }

  #logo > div {
    @apply flex justify-center gap-4;
  }

  #logo > div img {
    @apply w-6 hover:brightness-125;
  }

  nav {
    @apply flex justify-end gap-24 px-16;
  }

  nav div {
    @apply flex flex-col gap-6;
  }

  nav p {
    @apply font-bold text-neutral-400;
  }

  nav a {
    @apply text-neutral-400 no-underline transition-colors duration-300 hover:text-neutral-100;
  }

  footer > p {
    @apply mb-8 mt-24 w-full text-center text-sm text-neutral-500;
  }
</style>
