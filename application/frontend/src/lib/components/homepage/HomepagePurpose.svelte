<script lang="ts">
  import {onMount} from 'svelte';
  import {HOMEPAGE_SERVICES, HOMEPAGE_DEMO_PROFILES} from '$constant';
  import Icon from '$component/ui/Icon.svelte';
  import portraits from '$image/homepage/profile-pictures/persona-profiles.webp';

  let profileIndex = $state(0);
  let assembly: HTMLDivElement;

  onMount(() => {
    profileIndex = crypto.getRandomValues(new Uint32Array(1))[0] % HOMEPAGE_DEMO_PROFILES.length;
    const interval = window.setInterval(() => {
      if (document.hidden || assembly.dataset.inView !== 'true') {
        return;
      }

      profileIndex = (profileIndex + 1) % HOMEPAGE_DEMO_PROFILES.length;
    }, 5000);

    return () => window.clearInterval(interval);
  });
</script>

<section class="purpose" id="why-shadowself">
  <div class="chapter-width purpose-layout">
    <div class="purpose-copy" data-reveal>
      <h2>Privacy comes at a cost.<br /><span>It shouldn't be your time.</span></h2>
      <p>
        Burner numbers. Password managers. Separate email inboxes. Maintaining a private life online means paying for
        scattered tools and doing the work to keep them apart.
      </p>
      <p class="purpose-answer">
        That burden shouldn't come with wanting more control over your life. ShadowSelf brings those tools into one
        workspace, organized around the identity that uses them.
      </p>
    </div>
    <div class="assembly" bind:this={assembly} data-reveal aria-label="Identity tools organized under one profile">
      <div class="assembly-tools">
        {#each HOMEPAGE_SERVICES as service, index (service.id)}
          <div style:--tool-color={service.color} style:--delay={`${index * -0.7}s`}>
            <Icon name={service.icon} size={16} /><span>{service.name}</span><b aria-hidden="true">→</b>
          </div>
        {/each}
      </div>
      <div class="assembly-spine" aria-hidden="true"><span></span></div>
      <div class="assembly-profile">
        <div class="assembly-record">
          <div class="profile-topline">
            <span>Example identity</span>
          </div>
          <div class="profile-slides">
            {#each HOMEPAGE_DEMO_PROFILES as profile, index (profile.name)}
              <div
                class="profile-slide"
                class:active={index === profileIndex}
                class:exiting={index ===
                  (profileIndex + HOMEPAGE_DEMO_PROFILES.length - 1) % HOMEPAGE_DEMO_PROFILES.length}
                aria-hidden={index !== profileIndex}>
                <div class="profile-person">
                  <div
                    class="profile-portrait"
                    role="img"
                    aria-label={`Fictional portrait of ${profile.name}`}
                    style:background-image={`url(${portraits})`}
                    style:background-position={profile.position}>
                  </div>
                  <strong>{profile.name}</strong>
                  <span>{profile.location}</span>
                </div>
                <div class="profile-email"><Icon name="mail" size={13} /><span>{profile.email}</span></div>
                <dl class="profile-stats">
                  <div>
                    <dt>Saved accounts</dt>
                    <dd>{profile.accounts}</dd>
                  </div>
                  <div>
                    <dt>Wallet balance</dt>
                    <dd>{profile.balance}</dd>
                  </div>
                </dl>
              </div>
            {/each}
          </div>
        </div>
        <p class="assembly-caption">Choose the identity first.<br />Its tools are already together.</p>
      </div>
    </div>
  </div>
  <div class="purpose-benefits chapter-width" data-reveal>
    <article>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"
        ><path d="M7 30V7h34M13 35V13h34" stroke="currentColor" stroke-opacity=".35" /><rect
          x="19"
          y="19"
          width="38"
          height="24"
          rx="3"
          stroke="currentColor"
          stroke-width="1.5" /><path d="M19 26h38M25 32h10m-10 5h19" stroke="currentColor" /><circle
          cx="23"
          cy="23"
          r="1"
          fill="currentColor" /></svg>
      <h3>Fewer services to juggle.</h3>
      <p>Open the identity to reach its inbox, number, vault, and wallet.</p>
    </article>
    <article>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"
        ><rect x="5" y="7" width="22" height="32" rx="3" stroke="currentColor" stroke-opacity=".4" /><rect
          x="37"
          y="7"
          width="22"
          height="32"
          rx="3"
          stroke="currentColor"
          stroke-width="1.5" /><path
          d="M11 14h10m-10 6h7M43 14h10m-10 6h7M19 29h26m-6-5 6 5-6 5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round" /></svg>
      <h3>Less copying by hand.</h3>
      <p>Keep contact details beside the accounts that use them.</p>
    </article>
    <article>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"
        ><rect x="5" y="7" width="54" height="34" rx="4" stroke="currentColor" stroke-width="1.5" /><circle
          cx="20"
          cy="20"
          r="5"
          stroke="currentColor" /><path
          d="M11 33c0-10 18-10 18 0m8-18h14m-14 7h10m-10 7h14"
          stroke="currentColor"
          stroke-linecap="round" /><circle
          cx="54"
          cy="37"
          r="9"
          fill="#202b13"
          stroke="currentColor"
          stroke-width="1.5" /><path
          d="m49 37 3.5 3.5 6-7"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round" /></svg>
      <h3>Know which identity you're using.</h3>
      <p>See the profile before you reach for its tools.</p>
    </article>
  </div>
</section>

<style>
  .purpose {
    padding-block: 110px 55px;
    background: radial-gradient(ellipse at 80% 35%, #4f46e510, transparent 60%), #090f20;
  }
  .purpose-layout {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 85px;
    align-items: center;
  }
  .purpose-copy h2 {
    font-size: clamp(36px, 3.5vw, 49px);
    letter-spacing: -1.9px;
    margin-bottom: 32px;
  }
  .purpose-copy h2 span {
    color: var(--brand-accent);
  }
  .purpose-copy p {
    font-size: 14px;
    margin-top: 20px;
  }
  .purpose-copy .purpose-answer {
    color: #d0d7ee;
  }
  .assembly {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 45px minmax(0, 1.1fr);
    align-items: center;
    position: relative;
  }
  .assembly-tools {
    display: grid;
    gap: 12px;
  }
  .assembly-tools > div {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 12px;
    background: #11182b;
    border-bottom: 1px solid color-mix(in srgb, var(--tool-color) 25%, transparent);
    border-radius: 5px 0 0 5px;
  }
  .assembly-tools :global(svg) {
    color: var(--tool-color);
    flex-shrink: 0;
  }
  .assembly-tools span {
    font-size: 11px;
    color: #bcc5de;
  }
  .assembly-tools b {
    margin-left: auto;
    color: var(--tool-color);
    font-size: 12px;
    font-weight: 400;
    animation: signal 5.6s var(--delay) ease infinite;
  }
  .assembly-spine {
    border: 1px solid #818cf84d;
    border-left: 0;
    height: calc(100% - 68px);
    margin-right: 22px;
    position: relative;
  }
  .assembly-spine::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    height: 1px;
    width: 23px;
    background: #818cf880;
  }
  .assembly-spine span {
    position: absolute;
    width: 3px;
    height: 35px;
    right: -2px;
    background: linear-gradient(transparent, #a5b4fc, transparent);
    animation: collect 6s linear infinite;
  }
  .assembly-profile {
    position: relative;
  }
  .assembly-record {
    padding: 25px 18px;
    border: 1px solid #818cf85e;
    background: linear-gradient(150deg, #24264a, #12192e);
    border-radius: 9px;
    box-shadow: 0 25px 50px #0004;
  }
  .profile-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #8998bb;
    font-size: 9px;
  }
  .profile-slides {
    position: relative;
    height: 260px;
    min-width: 0;
  }
  .profile-slide {
    position: absolute;
    inset: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .profile-slide.active {
    visibility: visible;
    z-index: 1;
    animation: persona-enter 500ms ease-in-out both;
  }
  .profile-slide.exiting {
    visibility: visible;
    z-index: 2;
    animation: persona-exit 500ms ease-in-out both;
  }
  @keyframes persona-enter {
    from {
      clip-path: inset(0 100% 0 0);
    }
    to {
      clip-path: inset(0);
    }
  }
  @keyframes persona-exit {
    from {
      clip-path: inset(0);
    }
    to {
      clip-path: inset(0 0 0 100%);
    }
  }
  .profile-person {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 9px;
    padding-block: 18px;
  }
  .profile-portrait {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-size: 300% 200%;
    box-shadow: 0 0 0 4px #6366f11a;
  }
  .profile-person strong {
    color: #e0e7ff;
    font-size: clamp(15px, 1.4vw, 19px);
    white-space: nowrap;
    font-weight: 500;
  }
  .profile-person > span {
    color: #9daac7;
    font-size: 10px;
  }
  .profile-email {
    min-height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #a5b4fc;
    font-size: 9px;
    overflow-wrap: anywhere;
  }
  .profile-stats {
    display: grid;
    gap: 12px;
    border-top: 1px solid #818cf82b;
    padding-top: 16px;
    margin: 18px 0 0;
  }
  .profile-stats > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 10px;
  }
  .profile-stats dt {
    color: #94a3b8;
  }
  .profile-stats dd {
    margin: 0;
    color: #dbe5ff;
    font-variant-numeric: tabular-nums;
  }
  .assembly-caption {
    position: absolute;
    top: calc(100% + 16px);
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 10px;
    line-height: 1.7;
  }
  .purpose-benefits {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 38px;
    margin-top: 80px;
    padding-block: 35px 15px;
  }
  .purpose-benefits article {
    color: var(--brand-accent);
  }
  .purpose-benefits article:nth-child(2) {
    color: #22d3ee;
  }
  .purpose-benefits article:nth-child(3) {
    color: #bef264;
  }
  .purpose-benefits svg {
    width: 64px;
    height: 48px;
    margin-bottom: 20px;
  }
  .purpose-benefits h3 {
    font-size: 20px;
    line-height: 1.4;
    font-weight: 500;
    letter-spacing: -0.4px;
    margin-bottom: 13px;
  }
  .purpose-benefits p {
    font-size: 13px;
    line-height: 1.8;
    max-width: 280px;
  }

  @media (prefers-reduced-motion: reduce) {
    .profile-slide.exiting {
      visibility: hidden;
    }
  }
  @keyframes signal {
    0%,
    75%,
    100% {
      opacity: 0.35;
      translate: 0;
    }
    85% {
      opacity: 1;
      translate: 4px;
    }
  }
  @keyframes collect {
    from {
      top: 0;
    }
    to {
      top: calc(100% - 35px);
    }
  }
  @media (max-width: 1000px) {
    .purpose-layout {
      gap: 40px;
    }
    .assembly {
      grid-template-columns: minmax(0, 1fr) 25px minmax(0, 1fr);
    }
    .assembly-spine {
      margin-right: 12px;
    }
    .assembly-spine::after {
      width: 13px;
    }
    .assembly-record {
      padding-inline: 12px;
    }
  }
  @media (max-width: 750px) {
    .purpose {
      padding-block: 65px 35px;
    }
    .purpose-layout {
      grid-template-columns: 1fr;
      gap: 45px;
    }
    .purpose-copy h2 {
      font-size: 36px;
      letter-spacing: -1.5px;
    }
    .assembly {
      max-width: 470px;
      width: 100%;
      margin: 0 auto 30px;
      grid-template-columns: minmax(0, 1fr) 35px minmax(0, 1.1fr);
    }
    .assembly-spine {
      margin-right: 17px;
    }
    .assembly-spine::after {
      width: 18px;
    }
    .purpose-benefits {
      margin-top: 50px;
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .purpose-benefits article {
      display: grid;
      grid-template-columns: 54px 1fr;
      column-gap: 18px;
    }
    .purpose-benefits svg {
      grid-row: span 2;
      width: 54px;
      height: 44px;
      margin: 0;
    }
    .purpose-benefits h3 {
      font-size: 19px;
      margin-bottom: 8px;
    }
    .purpose-benefits p {
      max-width: none;
    }
  }
  @media (max-width: 380px) {
    .assembly {
      grid-template-columns: 1fr;
    }
    .assembly-tools {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .assembly-tools > div {
      padding: 12px 9px;
      border-radius: 5px;
    }
    .assembly-spine {
      height: 30px;
      width: 1px;
      margin: 0 auto;
      border: 0;
      border-left: 1px solid #818cf84d;
    }
    .assembly-spine::after {
      display: none;
    }
    .assembly-spine span {
      display: none;
    }
    .assembly-profile {
      max-width: 260px;
      width: 100%;
      margin: auto;
    }
    .assembly-caption {
      position: static;
      margin-top: 15px;
    }
  }
</style>
