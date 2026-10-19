<script lang="ts">
  import background from '$image/homepage/welcome-background.webp';
  import {HOMEPAGE_SERVICES} from '$constant';
  import {page} from '$app/state';
</script>

<section class="spectrum-hero" id="overview">
  <div class="identity-wall" style:background-image={`url(${background})`} aria-hidden="true"></div>
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
    inset: -60px -20%;
    background-size: auto 100%;
    background-position: center;
    opacity: 0.45;
    z-index: -3;
    animation: wall-drift 70s linear infinite alternate;
    transform: rotate(-5deg) scale(1.1);
  }
  .spectrum-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      linear-gradient(180deg, #080b1899, transparent 30%, #070b1bf0 93%),
      radial-gradient(ellipse, #070b1bd9 12%, transparent 70%);
  }
  .hero-light {
    position: absolute;
    top: 12%;
    left: 15%;
    right: 15%;
    height: 60%;
    background: radial-gradient(ellipse, #5534e030, transparent 66%);
    filter: blur(50px);
    z-index: -1;
  }
  .hero-content {
    text-align: center;
  }
  .hero-content h1 {
    font-size: clamp(56px, 7.4vw, 112px);
    font-weight: 650;
    letter-spacing: -5px;
    line-height: 1.08;
    animation: hero-enter 1s both;
  }
  .hero-content h1 span {
    background: linear-gradient(100deg, #56b9fc, #8773ff 47%, #d073ee);
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
    background: #a79efb;
    animation: scroll-down 2.5s ease infinite;
  }
  @keyframes wall-drift {
    from {
      translate: -4% 0;
    }
    to {
      translate: 4% -3%;
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
      font-size: 77px;
    }
  }
  @media (max-width: 700px) {
    .spectrum-hero {
      min-height: 780px;
      padding: 90px 0;
    }
    .hero-content h1 {
      font-size: clamp(42px, 8.5vw, 60px);
      letter-spacing: -2.5px;
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
