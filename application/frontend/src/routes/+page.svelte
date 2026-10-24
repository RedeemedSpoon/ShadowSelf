<script lang="ts">
  import HomepageHero from '$component/homepage/HomepageHero.svelte';
  import HomepageFeatures from '$component/homepage/HomepageFeatures.svelte';
  import HomepageLifecycle from '$component/homepage/HomepageLifecycle.svelte';
  import HomepagePurpose from '$component/homepage/HomepagePurpose.svelte';
  import HomepagePrivacy from '$component/homepage/HomepagePrivacy.svelte';
  import HomepagePricing from '$component/homepage/HomepagePricing.svelte';
  import HomepageClosing from '$component/homepage/HomepageClosing.svelte';

  function revealChapters(node: HTMLElement) {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (preference.matches) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          (entry.target as HTMLElement).dataset.revealed = 'true';
          observer.unobserve(entry.target);
        }
      },
      {threshold: 0.1},
    );

    const ambientObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        (entry.target as HTMLElement).dataset.inView = String(entry.isIntersecting);
      }
    });

    node.querySelectorAll(':scope > section, .service-visual, .assembly').forEach((section) => {
      section.setAttribute('data-ambient', '');
      ambientObserver.observe(section);
    });

    node.dataset.ambient = 'observed';
    node.dataset.motion = 'enabled';
    node.querySelectorAll('[data-reveal]').forEach((section) => observer.observe(section));

    const stopMotion = () => {
      if (!preference.matches) {
        return;
      }

      delete node.dataset.motion;
      observer.disconnect();
    };

    preference.addEventListener('change', stopMotion);

    return {
      destroy() {
        observer.disconnect();
        ambientObserver.disconnect();
        preference.removeEventListener('change', stopMotion);
      },
    };
  }
</script>

<svelte:head>
  <title>ShadowSelf | Create and manage separate online identities</title>
  <meta
    name="description"
    content="Create synthetic identities with their own profiles, account vaults, email aliases, PGP, mobile numbers, wallets, virtual cards, residential proxies, cloud storage, and privacy utilities. Explore ShadowSelf's open-source identity tools." />
</svelte:head>

<a class="homepage-skip" href="#overview">Skip to homepage content</a>
<div class="homepage" use:revealChapters>
  <HomepageHero />
  <HomepagePurpose />
  <HomepageFeatures />
  <HomepageLifecycle />
  <HomepagePricing />
  <HomepagePrivacy />
  <HomepageClosing />
</div>

<style>
  .homepage {
    --brand-accent: var(--accent);
    --brand-line: color-mix(in srgb, var(--accent-strong) 25.1%, transparent);
    background: #090f20;
    color: #e6ebff;
    font-family: 'Inter Variable', sans-serif;
    overflow: clip;
  }
  :global(.homepage > section + section),
  :global(.homepage > .profile-tools),
  :global(.homepage > .profile-tools + section) {
    border-top: 1px solid #7786b329;
    box-shadow: inset 0 1px #02061780;
  }
  :global(:where(.homepage) *) {
    box-sizing: border-box;
  }
  :global(:where(.homepage) h1),
  :global(:where(.homepage) h2) {
    background: none;
    color: #e7eaf9;
    -webkit-text-fill-color: currentColor;
    font-weight: 500;
    margin: 0;
  }
  :global(:where(.homepage) p) {
    font-size: 15px;
    line-height: 1.9;
    color: #aab6d1;
    margin: 0;
    text-wrap: pretty;
  }
  :global(:where(.homepage) a) {
    text-decoration: none;
  }
  :global(:where(.homepage) button) {
    font-family: inherit;
    transition:
      background 200ms ease,
      border-color 200ms ease,
      color 200ms ease;
  }
  :global(.homepage .chapter-width) {
    width: min(1160px, calc(100% - 100px));
    margin-inline: auto;
  }
  :global(.homepage a:focus-visible),
  :global(.homepage button:focus-visible),
  :global(.homepage summary:focus-visible) {
    outline: none;
    box-shadow: var(--control-focus-shadow);
  }
  :global(.homepage section[id]),
  :global(.homepage div[id]) {
    scroll-margin-top: 100px;
  }
  :global(.homepage[data-motion='enabled'] [data-reveal]) {
    opacity: 0;
    transform: translateY(30px);
    transition:
      opacity 800ms ease,
      transform 800ms cubic-bezier(0.2, 0.65, 0.3, 1);
  }
  :global(.homepage[data-motion='enabled'] [data-reveal][data-revealed='true']) {
    opacity: 1;
    transform: translateY(0);
  }
  :global(.homepage[data-ambient='observed'] [data-ambient]:not([data-in-view='true']) *),
  :global(.homepage[data-ambient='observed'] [data-ambient]:not([data-in-view='true']) *::before),
  :global(.homepage[data-ambient='observed'] [data-ambient]:not([data-in-view='true']) *::after) {
    animation-play-state: paused !important;
  }
  .homepage-skip {
    position: fixed;
    left: 20px;
    top: -90px;
    z-index: 100;
    padding: 14px;
    background: #282040;
    color: white;
    border-radius: 5px;
  }
  .homepage-skip:focus {
    top: 15px;
  }
  @layer base {
    :global(.homepage h1),
    :global(.homepage h2) {
      line-height: 1.13 !important;
    }
  }
  @media (max-width: 900px) {
    :global(.homepage .chapter-width) {
      width: calc(100% - 60px);
    }
  }
  @media (max-width: 600px) {
    :global(.homepage .chapter-width) {
      width: calc(100% - 40px);
    }
    :global(.homepage .primary-action) {
      font-size: 12px;
      min-height: 48px;
      padding: 13px 21px;
    }
    :global(.homepage .secondary-action) {
      font-size: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(html:has(.homepage)) {
      scroll-behavior: auto;
    }
    :global(.homepage *),
    :global(.homepage *::before),
    :global(.homepage *::after) {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
    :global(.homepage [data-reveal]) {
      opacity: 1 !important;
      transform: none !important;
    }
  }
</style>
