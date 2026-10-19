<script lang="ts">
  import {page} from '$app/state';
</script>

<section class="spectrum-close">
  <div class="close-lines" aria-hidden="true"></div>
  <div class="chapter-width" data-reveal>
    <h2>Your life is yours.<br /><span class="spectrum-text">Keep it that way.</span></h2>
    <p>
      A name for the forum. An inbox for the project. A number that isn't yours.<br />Give the internet only what you
      choose.
    </p>
    <a class="primary-action" href={page.data.user ? '/dashboard' : '/signup'}
      >{page.data.user ? 'Build your next identity' : 'Make your first identity'} <span aria-hidden="true">↗</span></a>
  </div>
</section>

<style>
  .spectrum-text {
    background: linear-gradient(100deg, #57b6ef, #8d7bf5, #c976eb);
    background-size: 200% 100%;
    animation: spectrum-flow 16s ease-in-out infinite alternate;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .spectrum-close {
    position: relative;
    overflow: hidden;
    text-align: center;
    min-height: calc(100svh - 87px);
    display: grid;
    place-items: center;
    padding-block: 65px;
    background: linear-gradient(#0b1020, #090e23 35%);
    isolation: isolate;
  }
  .spectrum-close h2 {
    font-size: clamp(44px, 5.5vw, 78px);
    letter-spacing: -3px;
  }
  .spectrum-close p {
    margin: 26px 0 30px;
  }
  .close-lines {
    position: absolute;
    inset: -100%;
    background: repeating-conic-gradient(from 0deg at 50% 50%, transparent 0 8deg, #a594ff70 8.1deg 8.25deg);
    z-index: -1;
    animation: rotate-lines 100s linear infinite;
    mask-image: radial-gradient(ellipse, transparent 10%, #000 50%, transparent 65%);
  }
  .spectrum-close .primary-action {
    position: relative;
    overflow: hidden;
    gap: 10px;
    animation: action-glow 5s ease-in-out infinite;
  }
  .spectrum-close .primary-action::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 35%, #ffffff25 50%, transparent 65%);
    translate: -120%;
    animation: action-sheen 7s ease-in-out infinite;
    pointer-events: none;
  }
  .spectrum-close .primary-action span {
    transition: transform 180ms ease;
  }
  .spectrum-close .primary-action:hover span {
    transform: translate(2px, -2px);
  }
  @keyframes spectrum-flow {
    from {
      background-position: 0% 50%;
    }
    to {
      background-position: 100% 50%;
    }
  }
  @keyframes action-glow {
    0%,
    100% {
      box-shadow: 0 8px 28px #6253ec25;
    }
    50% {
      box-shadow: 0 8px 38px #6253ec65;
    }
  }
  @keyframes action-sheen {
    0%,
    70% {
      translate: -120%;
    }
    100% {
      translate: 120%;
    }
  }
  @keyframes rotate-lines {
    to {
      rotate: 360deg;
    }
  }
  @media (max-width: 700px) {
    .spectrum-close {
      min-height: calc(100svh - 80px);
      padding-block: 50px;
    }
    .spectrum-close h2 {
      font-size: 43px;
      letter-spacing: -2px;
    }
  }
</style>
