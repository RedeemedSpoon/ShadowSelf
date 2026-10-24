<script lang="ts">
  let {contrast = 14, running = true}: {contrast?: number; running?: boolean} = $props();
</script>

<div class="auth-background" aria-hidden="true">
  <div class="rotor" class:paused={!running} style="opacity: {contrast / 100}">
    <img src="/auth-spiral.webp" width="3072" height="3072" alt="" decoding="async" draggable={false} />
  </div>
  <div class="shade"></div>
</div>

<style>
  .auth-background {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    container-type: size;
    background: #090f20;
  }
  .rotor {
    position: absolute;
    left: 50%;
    top: 50%;
    width: max(145cqw, 145cqh);
    height: max(145cqw, 145cqh);
    translate: -50% -50%;
    contain: paint;
    will-change: transform;
    animation: spiral-turn 720s linear infinite;
  }
  .rotor.paused {
    animation-play-state: paused;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
  }
  .shade {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 48%, #090f2055, transparent 65%);
    box-shadow: inset 0 0 150px #03071080;
  }
  @keyframes spiral-turn {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .rotor {
      animation: none;
      will-change: auto;
    }
  }
</style>
