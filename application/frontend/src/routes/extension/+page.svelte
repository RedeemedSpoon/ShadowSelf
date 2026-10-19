<script lang="ts">
  import logo from '$image/brands/shadowself/icon.svg';
  import portrait from '$image/homepage/profile-pictures/theo-mercer.webp';
  import Icon from '$component/ui/Icon.svelte';
  import {EXTENSION_STORES} from '$constant';

  let storesExpanded = $state(false);
</script>

<svelte:head>
  <title>Browser extension | ShadowSelf</title>
  <meta
    name="description"
    content="Keep your ShadowSelf identities within reach while browsing. Get the browser extension." />
</svelte:head>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') {
      storesExpanded = false;
    }
  }} />

<section class="extension-page">
  <div class="extension-copy">
    <h1>Your identities.<br /><span>Within reach.</span></h1>
    <p>
      Keep your identities close while you browse. Open their profiles, messages, and account vaults from the extension,
      then get back to what you were doing.
    </p>
    <div class="extension-download">
      <a class="extension-action" href={EXTENSION_STORES[0].href} target="_blank" rel="noreferrer">
        Add to Firefox <Icon name="download" size={17} />
      </a>
      <details bind:open={storesExpanded}>
        <summary aria-label="Other browsers"><Icon name="arrow" size={17} /></summary>
        <div class="browser-stores">
          {#each EXTENSION_STORES.slice(1) as store (store.browser)}
            <a href={store.href} target="_blank" rel="noreferrer" onclick={() => (storesExpanded = false)}
              >Add to {store.browser} <Icon name="external" size={15} /></a>
          {/each}
        </div>
      </details>
    </div>
  </div>
  <div
    class="extension-art"
    role="img"
    aria-label="Illustration of the ShadowSelf browser extension with an identity selected">
    <svg class="signal-field" viewBox="0 0 500 500" fill="none" aria-hidden="true">
      <defs>
        <pattern id="extension-dots" width="24" height="24" patternUnits="userSpaceOnUse"
          ><circle cx="12" cy="12" r="1" fill="#8773ff" opacity=".25" /></pattern>
      </defs>
      <circle cx="250" cy="250" r="225" fill="url(#extension-dots)" />
      <g class="signal-traces">
        <path d="M20 155h70l45 45h90M480 345h-65l-50-50h-90M140 25v65l60 60v70M360 475v-65l-60-60v-70" />
        <circle cx="20" cy="155" r="4" /><circle cx="480" cy="345" r="4" />
        <circle cx="140" cy="25" r="4" /><circle cx="360" cy="475" r="4" />
      </g>
      <g class="signal-packets">
        <path d="M20 155h70l45 45h90" pathLength="100" />
        <path d="M480 345h-65l-50-50h-90" pathLength="100" />
        <path d="M140 25v65l60 60v70" pathLength="100" />
        <path d="M360 475v-65l-60-60v-70" pathLength="100" />
      </g>
      <circle class="signal-ring" cx="250" cy="250" r="195" />
      <circle class="signal-ring outer-ring" cx="250" cy="250" r="225" />
    </svg>
    <div class="browser-outline" aria-hidden="true"><span></span><span></span><span></span><i></i></div>
    <div class="extension-preview" aria-hidden="true">
      <div class="preview-brand">
        <img src={logo} alt="" width="30" height="30" /><span>ShadowSelf</span><Icon name="settings" size={17} />
      </div>
      <div class="preview-label"><span>Browser companion</span><i></i></div>
      <div class="identity-preview">
        <img src={portrait} alt="" width="55" height="62" />
        <div><strong>Theo Mercer</strong><span>@theo_m</span></div>
      </div>
      <div class="preview-tools">
        <span><Icon name="lock" size={21} /></span><span><Icon name="mail" size={21} /></span><span
          ><Icon name="phone" size={21} /></span>
      </div>
      <div class="preview-action">Open identity <Icon name="arrow" size={16} /></div>
    </div>
    <div class="extension-pin" aria-hidden="true"><img src={logo} alt="" width="29" height="29" /></div>
  </div>
</section>

<style>
  .extension-download {
    position: relative;
    display: inline-flex;
    align-items: stretch;
  }
  .extension-download .extension-action {
    border-radius: 7px 0 0 7px;
  }
  .extension-download summary {
    list-style: none;
    display: grid;
    place-items: center;
    height: 100%;
    padding-inline: 14px;
    color: #f3f0ff;
    background: #4938c9;
    border: 1px solid #a298ff70;
    border-left: 0;
    border-radius: 0 7px 7px 0;
    cursor: pointer;
    transition: background 180ms ease;
  }
  .extension-download summary::-webkit-details-marker {
    display: none;
  }
  .extension-download summary :global(svg) {
    transform: rotate(90deg);
    transition: transform 180ms ease;
  }
  .extension-download details[open] summary :global(svg) {
    transform: rotate(-90deg);
  }
  .extension-download summary:hover {
    background: #6253ec;
  }
  .browser-stores {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 5;
    padding: 6px;
    border: 1px solid #a5b4fc30;
    border-radius: 8px;
    background: #11182a;
    box-shadow: 0 15px 35px #0005;
  }
  .browser-stores a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 5px;
    color: #dce3f7;
    font-size: 13px;
    transition: background 180ms ease;
  }
  .browser-stores a:hover {
    background: #8773ff15;
  }

  .extension-page {
    width: min(1100px, calc(100% - 80px));
    margin-inline: auto;
    min-height: calc(100svh - var(--public-header-height));
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 50px;
    padding-block: 80px;
  }
  h1 {
    margin: 0 0 26px;
    color: #e6ebff;
    font-size: clamp(40px, 4.5vw, 64px);
    line-height: 1.12;
    font-weight: 550;
    letter-spacing: -2px;
  }
  h1 span {
    color: #b3a5ff;
  }
  p {
    max-width: 460px;
    color: #aab6d1;
    font-size: 15px;
    line-height: 1.9;
    margin: 0 0 30px;
    text-wrap: pretty;
  }
  .extension-action {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 23px;
    border: 1px solid #a298ff70;
    border-radius: 7px;
    background: linear-gradient(135deg, #6253ec, #4938c9);
    color: #f3f0ff;
    font-size: 14px;
    box-shadow: 0 8px 28px #6253ec25;
    transition:
      transform 180ms ease,
      box-shadow 180ms ease;
  }
  .extension-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px #6253ec50;
  }
  .extension-action:active {
    transform: translateY(0);
  }
  .extension-action :global(svg) {
    transition: transform 180ms ease;
  }
  .extension-action:hover :global(svg) {
    transform: translateX(3px);
  }
  .extension-art {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    isolation: isolate;
  }
  .signal-field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
  }
  .signal-traces {
    stroke: #8773ff40;
    stroke-width: 1;
  }
  .signal-traces circle {
    fill: #8773ff;
    stroke: #8773ff20;
    stroke-width: 7;
  }
  .signal-packets {
    stroke: #b3a5ff;
    stroke-width: 2;
    stroke-dasharray: 6 94;
    animation: signal-travel 8s linear infinite;
  }
  .signal-packets path:nth-child(even) {
    stroke: #38bdf8;
  }
  .signal-ring {
    stroke: #8773ff40;
    stroke-width: 1;
    stroke-dasharray: 3 15;
    transform-origin: 250px 250px;
    animation: orbit 90s linear infinite;
  }
  .outer-ring {
    stroke: #38bdf820;
    stroke-dasharray: 20 180;
    animation-direction: reverse;
  }
  .browser-outline {
    position: absolute;
    inset: 13% 7% 18% 10%;
    border: 1px solid #8773ff35;
    border-radius: 13px;
    background: #10172970;
    transform: rotate(7deg);
    padding: 15px;
    z-index: -1;
  }
  .browser-outline > span {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #8773ff50;
    margin-right: 5px;
  }
  .browser-outline i {
    display: inline-block;
    width: 50%;
    height: 8px;
    margin-left: 16px;
    border-radius: 4px;
    background: #8773ff10;
  }
  .extension-preview {
    width: 65%;
    border: 1px solid #a5b4fc50;
    border-radius: 13px;
    padding: 24px;
    background: #11182a;
    box-shadow: 0 25px 60px #0006;
    transform: rotate(-5deg);
    animation: companion-float 9s ease-in-out infinite;
  }
  .preview-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    color: #dce3f7;
  }
  .preview-brand :global(svg) {
    margin-left: auto;
    color: #8491af;
  }
  .preview-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 26px 0 17px;
    color: #8491af;
    font-size: 10px;
  }
  .preview-label i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 10px #34d39960;
  }
  .identity-preview {
    display: flex;
    align-items: center;
    gap: 13px;
  }
  .identity-preview img {
    border-radius: 6px;
    object-fit: cover;
  }
  .identity-preview strong {
    display: block;
    color: #e6ebff;
    font-size: 17px;
    font-weight: 500;
  }
  .identity-preview div > span {
    display: block;
    margin-top: 7px;
    font:
      10px 'Fira Code Variable',
      monospace;
    color: #a99ae9;
  }
  .preview-tools {
    display: flex;
    gap: 12px;
    margin: 25px 0;
  }
  .preview-tools > span {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: #fbbf240c;
    color: #fbbf24;
  }
  .preview-tools > span:nth-child(2) {
    color: #fb7185;
    background: #fb71850c;
  }
  .preview-tools > span:nth-child(3) {
    color: #38bdf8;
    background: #38bdf80c;
  }
  .preview-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 15px;
    border-radius: 6px;
    background: #6253ec;
    color: #eee9ff;
    font-size: 11px;
  }
  .extension-pin {
    position: absolute;
    right: 11%;
    top: 12%;
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    background: #25213e;
    border: 1px solid #8773ff60;
    border-radius: 15px;
    color: #b3a5ff;
    transform: rotate(12deg);
    box-shadow: 0 12px 25px #0004;
  }
  @keyframes signal-travel {
    to {
      stroke-dashoffset: -100;
    }
  }
  @keyframes orbit {
    to {
      rotate: 360deg;
    }
  }
  @keyframes companion-float {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -9px;
    }
  }
  @media (max-width: 800px) {
    .extension-page {
      width: calc(100% - 40px);
      grid-template-columns: 1fr;
      gap: 35px;
      padding-block: 60px 45px;
    }
    .extension-copy {
      max-width: 520px;
      margin-inline: auto;
      text-align: center;
    }
    h1 {
      font-size: 43px;
    }
    p {
      margin-inline: auto;
      font-size: 14px;
    }
    .extension-art {
      width: min(480px, 100%);
      margin-inline: auto;
    }
  }
  @media (max-width: 400px) {
    .extension-preview {
      width: 72%;
      padding: 18px;
    }
    .identity-preview strong {
      font-size: 14px;
    }
    .preview-brand {
      font-size: 14px;
    }
    .extension-pin {
      right: 5%;
      top: 8%;
      width: 50px;
      height: 50px;
    }
  }
</style>
