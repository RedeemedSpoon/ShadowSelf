<script lang="ts">
  import {HOMEPAGE_SERVICES} from '$constant';
  import {page} from '$app/state';
</script>

<section class="spectrum-hero" id="overview">
  <div class="identity-wall" aria-hidden="true">
    <svg class="identity-pattern" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <g id="hero-identity-card">
          <rect
            x="1"
            y="1"
            width="286"
            height="166"
            rx="16"
            fill="currentColor"
            fill-opacity="0.035"
            stroke="currentColor"
            stroke-opacity="0.28" />
          <rect x="22" y="28" width="78" height="104" rx="10" fill="currentColor" fill-opacity="0.09" />
          <circle cx="61" cy="63" r="17" fill="currentColor" fill-opacity="0.24" />
          <path d="M34 118c0-22 12-35 27-35s27 13 27 35" fill="currentColor" fill-opacity="0.18" />
          <path
            d="M122 44h88m12 0h20M122 67h120M122 90h52m12 0h56M122 113h95"
            fill="none"
            stroke="currentColor"
            stroke-opacity="0.22"
            stroke-width="3"
            stroke-linecap="round" />
          <circle cx="262" cy="142" r="3" fill="currentColor" fill-opacity="0.45" />
        </g>
        <pattern id="hero-identity-tiles" width="960" height="208" patternUnits="userSpaceOnUse">
          <use href="#hero-identity-card" x="16" y="20" color="#9290f7" />
          <use href="#hero-identity-card" x="336" y="20" color="#6baccb" />
          <use href="#hero-identity-card" x="656" y="20" color="#b08adb" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-identity-tiles)" />
    </svg>
  </div>
  <div class="hero-light" aria-hidden="true"></div>
  <div class="hero-content chapter-width">
    <h1>Create identities.<br /><span>Keep yours private.</span></h1>
    <p>Give your online accounts their own profiles, inboxes, phone numbers, credentials, and wallets.</p>
    <div class="hero-actions">
      <a class="primary-action" href={page.data.user ? '/dashboard' : '/signup'}
        >{page.data.user ? 'Open dashboard' : 'Create your account'}</a
      ><a class="secondary-action" href="#services">Explore the identity tools <span aria-hidden="true">↓</span></a>
    </div>
  </div>
  <div class="hero-services" aria-label="Identity tools">
    {#each HOMEPAGE_SERVICES as service (service.id)}<a
        href={`#feature-${service.id}`}
        style:--service-color={service.color}><i></i>{service.name}</a
      >{/each}
  </div>
  <div class="scroll-cue" aria-hidden="true"><span></span></div>
</section>

<style>
  @keyframes spectrum-flow {
    from {
      background-position: 0% 50%;
    }
    to {
      background-position: 100% 50%;
    }
  }
  .spectrum-hero {
    position: relative;
    min-height: max(754px, calc(100svh - 76px));
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: 90px 0;
    isolation: isolate;
    background: #080c20;
  }
  .identity-wall {
    position: absolute;
    inset: min(-240px, -15vw) -480px;
    z-index: -3;
    opacity: 0.22;
    transform: rotate(-12deg);
    pointer-events: none;
  }
  .identity-pattern {
    display: block;
    width: calc(100% + 960px);
    height: 100%;
    animation: wall-drift 120s linear infinite;
  }
  .spectrum-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -2;
    background: radial-gradient(ellipse 70% 70% at 50% 50%, #080c2033 15%, #080c2059 55%, #080c208c 100%);
  }
  .hero-light {
    position: absolute;
    inset: 10% 15%;
    background: radial-gradient(ellipse, #5534e030, transparent 66%);
    z-index: -1;
  }
  .hero-content {
    text-align: center;
  }
  .hero-content h1 {
    font-size: clamp(48px, 6.5vw, 96px);
    font-weight: 650;
    letter-spacing: -3px;
    white-space: nowrap;
    line-height: 1.08;
    animation: hero-enter 1s both;
  }
  .hero-content h1 span {
    background: linear-gradient(100deg, var(--accent-strong), var(--accent) 47%, var(--accent-deep));
    background-size: 200% 100%;
    animation: spectrum-flow 16s ease-in-out infinite alternate;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
  .hero-content > p {
    max-width: 670px;
    margin: 35px auto 32px;
    font-size: 18px;
    line-height: 1.85;
    color: #b1bcd8;
    animation: hero-enter 1s 0.15s both;
  }
  .hero-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 28px;
    animation: hero-enter 1s 0.3s both;
  }
  .hero-services {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 25px;
    margin: 78px 25px 0;
    animation: hero-enter 1s 0.45s both;
  }
  .hero-actions .secondary-action {
    position: relative;
    gap: 5px;
    transition: color 240ms ease;
  }
  .hero-actions .secondary-action::after {
    content: '';
    position: absolute;
    inset: auto 0 7px;
    height: 1px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 260ms ease;
  }
  .hero-actions .secondary-action:hover,
  .hero-actions .secondary-action:focus-visible {
    color: var(--accent-light);
  }
  .hero-actions .secondary-action:hover::after,
  .hero-actions .secondary-action:focus-visible::after {
    transform: scaleX(1);
  }
  .secondary-action > span {
    transition: transform 260ms ease;
  }
  .secondary-action:hover > span,
  .secondary-action:focus-visible > span {
    transform: translateY(4px);
  }
  .hero-services a {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
    color: #acb5d4;
  }
  .hero-services i {
    height: 6px;
    width: 6px;
    border-radius: 50%;
    background: var(--service-color);
    box-shadow: 0 0 13px color-mix(in srgb, var(--service-color) 60%, transparent);
  }
  .scroll-cue {
    position: absolute;
    bottom: 25px;
    left: 50%;
    width: 1px;
    height: 35px;
    background: #8d87d536;
    overflow: hidden;
  }
  .scroll-cue span {
    display: block;
    width: 1px;
    height: 13px;
    background: var(--accent);
    animation: scroll-down 2.5s ease infinite;
  }
  @keyframes wall-drift {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-960px);
    }
  }
  @keyframes hero-enter {
    from {
      opacity: 0;
      transform: translateY(22px);
      filter: blur(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }
  @keyframes scroll-down {
    from {
      transform: translateY(-14px);
    }
    to {
      transform: translateY(40px);
    }
  }
  @media (max-width: 900px) {
    .hero-content h1 {
      font-size: 7vw;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .identity-pattern {
      animation: none;
    }
  }
  @media (max-width: 700px) {
    .spectrum-hero {
      min-height: 780px;
      padding: 90px 0;
    }
    .hero-content h1 {
      font-size: clamp(26px, 8.7vw, 60px);
      letter-spacing: -1px;
    }
    .hero-content > p {
      font-size: 16px;
      margin-top: 27px;
    }
    .hero-actions {
      gap: 20px;
    }
    .hero-services {
      gap: 18px 23px;
      margin-top: 50px;
    }
    .hero-services a {
      font-size: 10px;
    }
  }
</style>
