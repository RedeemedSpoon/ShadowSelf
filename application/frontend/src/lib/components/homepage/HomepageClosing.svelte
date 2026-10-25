<script lang="ts">
  import {page} from '$app/state';
  import Icon from '$component/ui/Icon.svelte';
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
      >{page.data.user ? 'Build your next identity' : 'Make your first identity'}
      <span aria-hidden="true"><Icon name="arrow" size={14} /></span></a>
  </div>
</section>

<style>
  .spectrum-text {
    background: linear-gradient(100deg, var(--accent-strong), var(--accent), var(--accent-deep));
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
    background: linear-gradient(#0a0f20, #090e23 65%);
    isolation: isolate;
  }
  .spectrum-close h2 {
    font-size: clamp(36px, 4.8vw, 68px);
    letter-spacing: -2px;
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
      color-mix(in srgb, var(--accent) 23.92%, transparent) 8.82deg,
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
    gap: var(--control-icon-gap);
  }
  @keyframes rotate-lines {
    to {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 700px) {
    .spectrum-close {
      min-height: calc(100svh - 80px);
      padding-block: 50px;
    }
    .spectrum-close h2 {
      font-size: clamp(28px, 7.5vw, 42px);
      letter-spacing: -1px;
    }
  }
</style>
