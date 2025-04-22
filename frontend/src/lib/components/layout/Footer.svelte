<script lang="ts">
  import {logo, github, mastodon, discord} from '$image';

  const navLinks = {
    Product: ['Homepage', 'Extension', 'Purchase'],
    Account: ['Dashboard', 'Settings', 'Docs'],
    Support: ['Contact', 'About', 'FAQ'],
    Legal: ['Terms of Service', 'Privacy Policy', 'Refund Policy'],
  };

  const socialLinks = {
    'Github Repository': {href: 'https://github.com/RedeemedSpoon/ShadowSelf', img: github},
    'Mastodon Account': {href: 'https://mastodon.social/@shadow_self', img: mastodon},
    'Discord Server': {href: 'https://discord.gg/HaHBwsEa6w', img: discord},
  };
</script>

<footer>
  <div class="mx-auto flex select-none flex-col-reverse items-center gap-16 px-4 lg:flex-row">
    <div class="flex flex-col items-center gap-6">
      <a href="/"><img loading="lazy" src={logo} alt="ShadowSelf" width="216" height="216" /></a>
      <div class="flex justify-center gap-4">
        {#each Object.entries(socialLinks) as [key, value]}
          <a rel="external" href={value.href}>
            <img src={value.img} alt={key} height="32" />
          </a>
        {/each}
      </div>
    </div>
    <nav class="flex flex-wrap justify-start gap-12 px-8 xl:gap-24">
      {#each Object.entries(navLinks) as [key, value]}
        <div class="flex flex-col gap-6">
          <p class="font-bold text-neutral-400">{key}</p>
          {#each value as link}
            {@const url = link === 'Homepage' ? '/' : `/${link.toLowerCase().replace(/ /g, '-')}`}
            <a href={url}>{link}</a>
          {/each}
        </div>
      {/each}
    </nav>
  </div>
  <p>&copy; {new Date().getFullYear()} - ShadowSelf. All rights reserved</p>
</footer>

<style lang="postcss">
  @reference "tailwindcss";

  footer {
    @apply sticky z-40 flex w-full flex-col bg-neutral-950 bg-opacity-75 pt-24;
  }

  img:not([alt='ShadowSelf']) {
    @apply h-6 transition-all duration-300 hover:brightness-125;
  }

  footer > p {
    @apply mb-8 mt-24 w-full text-center text-sm text-neutral-500;
  }
</style>
