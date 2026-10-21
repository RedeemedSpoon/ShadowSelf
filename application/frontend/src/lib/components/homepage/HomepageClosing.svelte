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
    background: linear-gradient(100deg, #60a5fa, #818cf8, #4f46e5);
    background-size: 200% 100%;
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
  .spectrum-close::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(ellipse at center, #090e23 12%, #090e23d9 32%, transparent 75%);
    pointer-events: none;
  }
  .close-lines {
    position: absolute;
    left: 50%;
    top: 50%;
    width: hypot(100vw, 100svh);
    aspect-ratio: 1;
    translate: -50% -50%;
    background: repeating-conic-gradient(
      from 0deg at center,
      transparent 0deg 8.65deg,
      #818cf83d 8.82deg,
      transparent 9deg
    );
    z-index: -2;
    transform-origin: center;
    animation: rotate-lines 100s linear infinite;
    pointer-events: none;
  }
  .spectrum-close .primary-action {
    position: relative;
    overflow: hidden;
    gap: 10px;
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
  @keyframes rotate-lines {
    to {
      transform: rotate(360deg);
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
