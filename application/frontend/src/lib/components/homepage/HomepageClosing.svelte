<script lang="ts">
  import {page} from '$app/state';
</script>

<section class="spectrum-close">
  <div class="close-lines" aria-hidden="true"></div>
  <div class="chapter-width" data-reveal>
    <h2>Create your first<br /><span class="spectrum-text">separate identity.</span></h2>
    <p>Start with a profile. Add the tools you need to use it.</p>
    <a class="primary-action" href={page.data.user ? '/dashboard' : '/signup'}>{page.data.user ? 'Open dashboard' : 'Create your account'}</a>
  </div>
</section>

<style>
  .spectrum-text {
    background: linear-gradient(100deg, #57b6ef, #8d7bf5, #c976eb);
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
    background: #090e23;
    border-top: 1px solid #ffffff0a;
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
