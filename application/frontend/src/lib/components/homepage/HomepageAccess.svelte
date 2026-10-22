<script lang="ts">
  import logo from '$image/brands/shadowself/icon.svg';
  import {page} from '$app/state';

  let spinning = $state(false);
  let sweeping = $state(false);

  function spinPlate() {
    if (spinning || sweeping || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    spinning = true;
    sweeping = true;
  }

  function finishSpin(event: AnimationEvent) {
    if (event.target === event.currentTarget) {
      spinning = false;
    }
  }
</script>

<div class="network-access" data-reveal>
  <div>
    <h3>Website, extension, and API.</h3>
    <p>
      Open an identity while browsing, manage it on the website, or automate it through the API. Each uses the same
      profiles, messages, and account records.
    </p>
    <a class="inline-link" href="/docs">Read the API documentation</a>
  </div>
  <div class="access-diagram">
    <div class="access-endpoints">
      <a href={page.data.user ? '/dashboard' : '/signup'}>Website<span>Manage the identity</span></a><a
        href="/extension">Extension<span>Use it while browsing</span></a
      ><a href="/docs">API<span>Build your own workflow</span></a>
    </div>
    <svg class="access-connections" viewBox="0 0 600 68" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path class="connection-track" d="M100 0V35H500V0M300 0V68" />
      <path class="connection-signal" pathLength="100" d="M100 0V35H300V68" />
      <path class="connection-signal" pathLength="100" d="M300 0V68" />
      <path class="connection-signal" pathLength="100" d="M500 0V35H300V68" />
    </svg>
    <div class="access-badge">
      <button
        class="access-source"
        class:spinning
        type="button"
        aria-label="Spin the One identity workspace badge"
        onpointerenter={(event) => {
          if (event.pointerType !== 'touch') {
            spinPlate();
          }
        }}
        onclick={spinPlate}>
        <span class="access-plate" class:spinning onanimationend={finishSpin}>
          <span class="plate-face plate-front"><img src={logo} alt="" /><span>One identity workspace</span></span>
          <span class="plate-face plate-back" aria-hidden="true">
            <svg class="plate-pattern" viewBox="0 0 270 68" fill="none">
              <path d="M104 4h62l30 30-30 30h-62L74 34Z M115 12h40l22 22-22 22h-40l-22-22Z" />
              <path d="M0 16h46l18 18h28M0 52h46l18-18M270 16h-46l-18 18h-28M270 52h-46l-18-18" />
              <path d="M15 8h42l14 14M15 60h42l14-14M255 8h-42l-14 14M255 60h-42l-14-14" />
              <circle cx="28" cy="16" r="3" /><circle cx="28" cy="52" r="3" />
              <circle cx="242" cy="16" r="3" /><circle cx="242" cy="52" r="3" />
            </svg>
            <span class="plate-emblem"><img src={logo} alt="" /></span>
          </span>
        </span>
      </button>
      {#if sweeping}<span class="plate-sweep" aria-hidden="true" onanimationend={() => (sweeping = false)}></span>{/if}
    </div>
  </div>
</div>

<style>
  .network-access {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 90px;
    align-items: center;
    padding-top: 65px;
    margin-top: 65px;
    border-top: 1px solid #64748b29;
  }
  .network-access h3 {
    font-size: 30px;
    letter-spacing: -1px;
    font-weight: 500;
    line-height: 1.3;
    color: #e0e7ff;
    margin-bottom: 25px;
  }
  .network-access p {
    font-size: 14px;
    margin-bottom: 27px;
  }
  .access-endpoints {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .access-endpoints a,
  .plate-face {
    border: 1px solid #6670b168;
    border-radius: 8px;
    background: linear-gradient(135deg, #1d2345, #171d37);
    box-shadow:
      inset 0 1px #c7d2fe0d,
      0 8px 22px #02061740;
  }
  .access-endpoints a {
    margin-inline: 6px;
    font-size: 14px;
    color: #c7d2fe;
    padding: 20px 8px;
    text-align: center;
    transition:
      transform 240ms ease,
      background 240ms ease,
      border-color 240ms ease,
      color 240ms ease,
      box-shadow 240ms ease;
  }
  .access-endpoints a:hover,
  .access-endpoints a:focus-visible {
    transform: translateY(-4px);
    color: #f1f5f9;
  }
  .access-endpoints a:hover span,
  .access-endpoints a:focus-visible span {
    color: #cbd5e1;
  }
  .access-endpoints span {
    display: block;
    font-size: 9px;
    color: #84a2bd;
    margin-top: 8px;
    transition: color 240ms ease;
  }
  .access-connections {
    display: block;
    width: 100%;
    height: 68px;
    overflow: visible;
    stroke: #8caed5;
    stroke-width: 1.5;
  }
  .access-connections path {
    vector-effect: non-scaling-stroke;
  }
  .connection-track {
    opacity: 0.45;
  }
  .connection-signal {
    stroke: var(--accent-light);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 12 112;
    stroke-dashoffset: 12;
    animation: converge 3.6s linear infinite;
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 50.2%, transparent));
  }
  @keyframes converge {
    0% {
      stroke-dashoffset: 12;
      opacity: 0;
    }
    8%,
    92% {
      opacity: 1;
    }
    100% {
      stroke-dashoffset: -112;
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .connection-signal {
      animation: none;
      opacity: 0;
    }
  }
  .access-badge {
    position: relative;
    width: min(100%, 270px);
    height: 68px;
    margin: 0 auto 20px;
  }
  .plate-sweep {
    position: absolute;
    z-index: 1;
    inset: -1px -2px;
    border-radius: 9px;
    pointer-events: none;
    opacity: 0;
    background: linear-gradient(105deg, transparent 15%, #6253ec66 32%, #c7d2feaa 45%, #6253ec66 58%, transparent 75%);
    background-size: 250% 100%;
    animation: settling-sweep 2000ms ease-in-out;
  }
  .access-source {
    --plate-duration: 1600ms;
    --plate-rotation: 1440deg;
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 9px;
    background: none;
    box-shadow: none;
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    perspective: 850px;
    -webkit-tap-highlight-color: transparent;
  }
  .access-plate {
    position: absolute;
    inset: 0;
    transform: rotateY(var(--plate-rotation));
    transform-style: preserve-3d;
    will-change: transform;
  }
  .access-plate.spinning {
    animation: plate-spin var(--plate-duration) linear;
  }
  .access-plate.spinning::before,
  .access-plate.spinning::after {
    content: '';
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: 6px;
    background: #373663;
    transform: rotateY(90deg);
    animation: plate-detail-hide var(--plate-duration) steps(1, end);
  }
  .access-plate.spinning::before {
    left: -3px;
  }
  .access-plate.spinning::after {
    right: -3px;
  }
  .plate-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    backface-visibility: hidden;
    overflow: hidden;
    transition:
      border-color 240ms ease,
      box-shadow 240ms ease;
  }
  .spinning .plate-front {
    animation: plate-face-settle var(--plate-duration) ease-out;
  }
  .plate-back {
    display: none;
    transform: rotateY(180deg) translateZ(3px);
    background: radial-gradient(ellipse at center, #2d2855, #141b32 75%);
  }
  .spinning .plate-back {
    display: flex;
    animation: plate-detail-hide var(--plate-duration) steps(1, end);
  }
  .plate-pattern {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    stroke: var(--accent);
    stroke-width: 0.8;
    opacity: 0.45;
  }
  .plate-pattern circle {
    fill: #171d37;
  }
  .plate-emblem {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid #8170ee66;
    border-radius: 7px;
    background: #1d2345;
    transform: rotate(45deg);
  }
  .plate-emblem img {
    transform: rotate(-45deg);
  }
  .access-endpoints a:hover,
  .access-endpoints a:focus-visible,
  .access-source:hover .plate-face,
  .access-source:focus-visible .plate-face {
    border-color: var(--accent);
    box-shadow:
      inset 0 1px #c7d2fe1a,
      0 8px 26px color-mix(in srgb, var(--accent-strong) 24%, transparent);
  }
  .access-source img {
    width: 28px;
    height: 28px;
  }
  @keyframes plate-spin {
    0% {
      transform: rotateY(0deg);
      animation-timing-function: cubic-bezier(0.12, 0.65, 0.2, 1);
    }
    80%,
    100% {
      transform: rotateY(var(--plate-rotation));
    }
  }
  @keyframes settling-sweep {
    0%,
    57% {
      opacity: 0;
      background-position: 120% 0;
    }
    66%,
    84% {
      opacity: 0.85;
    }
    100% {
      opacity: 0;
      background-position: -20% 0;
    }
  }
  @keyframes plate-face-settle {
    0%,
    65% {
      transform: translateZ(3px);
    }
    82%,
    100% {
      transform: none;
    }
  }
  @keyframes plate-detail-hide {
    0% {
      visibility: visible;
    }
    82%,
    100% {
      visibility: hidden;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .plate-sweep {
      animation-duration: 1ms;
    }
  }
  @media (max-width: 1050px) {
    .network-access {
      gap: 40px;
    }
  }
  @media (max-width: 700px) {
    .network-access {
      grid-template-columns: 1fr;
      padding-top: 40px;
      margin-top: 40px;
      gap: 45px;
    }
    .network-access h3 {
      font-size: 28px;
    }
    .access-endpoints a {
      position: relative;
      font-size: 12px;
      padding: 17px 5px;
    }
    .access-endpoints span {
      font-size: 8px;
    }
  }
</style>
