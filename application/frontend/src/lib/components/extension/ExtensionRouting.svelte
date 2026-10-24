<script lang="ts">
  import {onMount} from 'svelte';
  import {fly} from 'svelte/transition';
  import RoutingSpeed from './RoutingSpeed.svelte';
  import RoutingGlobe, {projectRoutingMarker} from './RoutingGlobe.svelte';
  import {MediaQuery} from 'svelte/reactivity';
  import {EXTENSION_ROUTE_PREVIEW} from '$constant';
  import Icon from '$component/ui/Icon.svelte';
  import logo from '$image/brands/shadowself/icon.svg';

  let scene: HTMLDivElement;
  let selected = $state(0);
  let connecting = $state(false);
  let viewLongitude = $state(EXTENSION_ROUTE_PREVIEW[0].viewLongitude as number);
  let notification = $state(false);
  let dismissNotification: ReturnType<typeof setTimeout>;
  let cursor = $state({x: 125, y: 355, opacity: 0, pressed: false});
  let settle: ReturnType<typeof setTimeout>;
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const route = $derived(EXTENSION_ROUTE_PREVIEW[selected]);
  const markers = $derived(
    EXTENSION_ROUTE_PREVIEW.map((location) =>
      projectRoutingMarker(location.longitude, location.latitude, viewLongitude),
    ),
  );

  function selectRoute(index: number) {
    clearTimeout(settle);
    clearTimeout(dismissNotification);
    notification = false;
    selected = index;
    connecting = true;
    settle = setTimeout(
      () => {
        connecting = false;
        notification = true;
        dismissNotification = setTimeout(() => {
          notification = false;
        }, 2800);
      },
      reducedMotion.current ? 0 : 1400,
    );
  }

  onMount(() => {
    let visible = false;
    let elapsed = 0;
    let previous = performance.now();
    let target = 1;
    let advanced = false;
    let startLongitude = viewLongitude;
    let frame: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      {threshold: 0.2},
    );

    observer.observe(scene);
    const resetCycle = () => {
      elapsed = 0;
      target = (selected + 1) % EXTENSION_ROUTE_PREVIEW.length;
      advanced = false;
      startLongitude = viewLongitude;
      cursor = {...cursor, opacity: 0};
    };

    const animate = (now: number) => {
      const delta = Math.min(now - previous, 100);
      previous = now;

      if (visible && !document.hidden && !reducedMotion.current) {
        elapsed += delta;

        if (elapsed >= 4000 && elapsed < 6000) {
          const location = EXTENSION_ROUTE_PREVIEW[target];
          const progress = Math.min((elapsed - 4000) / 1400, 1);
          const eased = progress * progress * (3 - 2 * progress);
          const angle = ((location.viewLongitude - startLongitude + 540) % 360) - 180;
          viewLongitude = startLongitude + angle * eased;
          const point = projectRoutingMarker(location.longitude, location.latitude, viewLongitude);
          cursor = {
            x: 125 + (point.x - 125) * eased,
            y: 355 + (point.y - 355) * eased,
            opacity: elapsed < 4200 ? (elapsed - 4000) / 200 : Math.min((6000 - elapsed) / 300, 1),
            pressed: elapsed >= 5400 && elapsed < 5550,
          };
        } else if (cursor.opacity !== 0) {
          cursor = {...cursor, opacity: 0};
        }

        if (elapsed >= 5400 && !advanced) {
          selectRoute(target);
          advanced = true;
        }

        if (elapsed >= 10000) {
          resetCycle();
        }
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      clearTimeout(dismissNotification);
    };
  });
</script>

<div
  class="routing-illustration"
  bind:this={scene}
  role="group"
  aria-label={`Residential routing concept. ${route.city}: example IP ${route.ip}, download ${route.download} megabits per second, upload ${route.upload} megabits per second, latency ${route.latency} milliseconds.`}>
  {#if notification}
    <div
      class="route-notification"
      role="status"
      aria-live="off"
      transition:fly={{y: -8, duration: reducedMotion.current ? 0 : 220}}>
      <span class="notification-brand"><img src={logo} alt="" width="23" height="23" /></span>
      <div><strong>Location changed</strong><span>{route.city}, {route.country}</span></div>
      <Icon name="check" size={16} />
    </div>
  {/if}
  <svg class="routing-canvas" viewBox="70 35 440 425" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="routing-globe-light" cx="36%" cy="28%" r="78%">
        <stop stop-color="#35316d" stop-opacity=".46" /><stop
          offset=".72"
          stop-color="#15213b"
          stop-opacity=".25" /><stop offset="1" stop-color="#090f20" stop-opacity=".1" />
      </radialGradient>
      <linearGradient id="routing-rim" x1="180" y1="70" x2="430" y2="350" gradientUnits="userSpaceOnUse"
        ><stop stop-color="#b8adff" stop-opacity=".6" /><stop
          offset=".5"
          stop-color="#9b91ff"
          stop-opacity=".12" /><stop offset="1" stop-color="#38bdf8" stop-opacity=".36" /></linearGradient>
      <filter id="routing-glow" x="-60%" y="-60%" width="220%" height="220%"
        ><feGaussianBlur stdDeviation="3" /></filter>
    </defs>

    <ellipse class="orbital-line" cx="300" cy="214" rx="208" ry="72" transform="rotate(-32 300 214)" />
    <circle cx="300" cy="214" r="164" fill="url(#routing-globe-light)" stroke="url(#routing-rim)" />
    <foreignObject x="136" y="50" width="328" height="328"><RoutingGlobe longitude={viewLongitude} /></foreignObject>
    <circle cx="300" cy="214" r="172" class="outer-rim" stroke-dasharray="2 10" />

    {#each EXTENSION_ROUTE_PREVIEW as location, index (location.city)}
      {@const point = markers[index]}
      {@const routePath = `M151 340C${180 + index * 45} 340 ${point.x - 65} ${point.y + 75} ${point.x} ${point.y}`}
      <g style:opacity={point.visibility}>
        <path class="route-shadow" class:active={selected === index} d={routePath} />
        <path class="route-line" class:active={selected === index} d={routePath} pathLength="1" />
        <path class="route-flow" class:active={selected === index} d={routePath} pathLength="100" />
        <g class="location-marker" class:active={selected === index} transform={`translate(${point.x} ${point.y})`}>
          <circle class="marker-halo" r="13" /><circle class="marker-core" r="4" />
          {#if selected === index && connecting}<circle class="click-ring" r="8" />{/if}
          <text x={location.labelX} y="-9" text-anchor={location.labelX < 0 ? 'end' : 'start'}>{location.city}</text>
          <text class="country-label" x={location.labelX} y="6" text-anchor={location.labelX < 0 ? 'end' : 'start'}
            >{location.country}</text>
        </g>
      </g>
    {/each}

    <g class="extension-origin">
      <circle cx="125" cy="355" r="39" class="origin-aura" />
      <circle cx="125" cy="355" r="31" fill="#151b33" stroke="#9b91ff66" />
      <image href={logo} x="104" y="334" width="42" height="42" />
      <text x="125" y="414" text-anchor="middle">SHADOWSELF</text>
      <text class="origin-label" x="125" y="430" text-anchor="middle">Browser extension</text>
    </g>

    <RoutingSpeed download={route.download} upload={route.upload} {connecting} />

    {#if !reducedMotion.current}
      <g
        class="illustration-cursor"
        style:opacity={cursor.opacity}
        transform={`translate(${cursor.x} ${cursor.y}) scale(${cursor.pressed ? 0.82 : 1})`}>
        <path
          d="M0 0v24l6-6 5 12 6-3-6-11h10L0 0Z"
          fill="#e8ecff"
          stroke="#0b1020"
          stroke-width="1.7"
          stroke-linejoin="round" />
      </g>
    {/if}
  </svg>

  <div class="connection-readout" aria-live="off">
    <div class="exit-address"><span>EXIT IP</span><code>{route.ip}</code></div>
    <div><span>LATENCY</span><strong>{route.latency}<small> ms</small></strong></div>
    <div><span>ROUTE TYPE</span><strong class="route-type">Residential</strong></div>
  </div>
  <p class="connected-location" class:connecting aria-live="off">
    <Icon name={connecting ? 'refresh' : 'check'} size={13} />
    <span>{connecting ? 'Connecting to:' : 'Connected to:'}</span>
    <strong>{route.city}, {route.country}</strong>
    <svg class="country-flag" viewBox="0 0 24 16" aria-hidden="true">
      {#if route.code === 'NL'}
        <path fill="#ae1c28" d="M0 0h24v6H0z" /><path fill="#fff" d="M0 5.33h24v5.34H0z" /><path
          fill="#21468b"
          d="M0 10.67h24V16H0z" />
      {:else if route.code === 'JP'}
        <path fill="#fff" d="M0 0h24v16H0z" /><circle fill="#bc002d" cx="12" cy="8" r="4.8" />
      {:else}
        <defs
          ><pattern id="routing-us-stars" width="1.8" height="1.72" patternUnits="userSpaceOnUse"
            ><circle cx="0.9" cy="0.86" r="0.32" fill="#fff" /></pattern
          ></defs>
        <path fill="#fff" d="M0 0h24v16H0z" />
        <path
          stroke="#b22234"
          stroke-width="1.23"
          d="M0 .615h24M0 3.075h24M0 5.535h24M0 7.995h24M0 10.455h24M0 12.915h24M0 15.375h24" />
        <path fill="#3c3b6e" d="M0 0h9v8.62H0z" /><path fill="url(#routing-us-stars)" d="M0 0h9v8.62H0z" />
      {/if}
    </svg>
  </p>
</div>

<style>
  .routing-illustration {
    width: 100%;
    max-width: 550px;
    min-width: 0;
    margin-inline: auto;
    position: relative;
    isolation: isolate;
  }
  .route-notification {
    position: absolute;
    top: -18px;
    left: 50%;
    translate: -50% 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(285px, calc(100% - 20px));
    padding: 11px 13px;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    border-radius: 8px;
    color: var(--accent-light);
    background: #191b3be8;
    box-shadow:
      0 8px 30px #02061760,
      inset 0 1px color-mix(in srgb, var(--accent-light) 5.1%, transparent);
    backdrop-filter: blur(12px);
  }
  .notification-brand {
    display: grid;
    place-items: center;
    width: 33px;
    height: 33px;
    border-radius: 7px;
    background: color-mix(in srgb, var(--accent) 7.84%, transparent);
  }
  .route-notification strong {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: #d5d9ff;
  }
  .route-notification div > span {
    display: block;
    margin-top: 5px;
    font-size: 10px;
    color: #929ccd;
  }
  .route-notification > :global(svg) {
    margin-left: auto;
  }
  .routing-canvas {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .orbital-line {
    stroke: color-mix(in srgb, var(--accent) 10.98%, transparent);
    stroke-dasharray: 4 8;
  }
  .outer-rim {
    stroke: color-mix(in srgb, var(--accent) 14.9%, transparent);
    stroke-width: 0.8;
  }
  .route-shadow {
    stroke: var(--accent);
    stroke-width: 6;
    filter: url(#routing-glow);
    opacity: 0;
    transition: opacity 800ms ease;
  }
  .route-shadow.active {
    opacity: 0.26;
  }
  .route-line {
    stroke: var(--accent-light);
    stroke-width: 1.3;
    stroke-linecap: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    opacity: 0;
    transition:
      stroke-dashoffset 1400ms cubic-bezier(0.22, 0.7, 0.2, 1),
      opacity 500ms ease;
  }
  .route-line.active {
    stroke-dashoffset: 0;
    opacity: 0.85;
  }
  .route-flow {
    stroke: #d4dcff;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 10 120;
    stroke-dashoffset: 10;
    opacity: 0;
  }
  .route-flow.active {
    animation: route-packet 3.8s linear infinite;
  }
  @keyframes route-packet {
    0% {
      stroke-dashoffset: 10;
      opacity: 0;
    }
    10%,
    88% {
      opacity: 1;
    }
    100% {
      stroke-dashoffset: -120;
      opacity: 0;
    }
  }
  .location-marker {
    opacity: 0.38;
    transition: opacity 500ms ease;
  }
  .location-marker.active {
    opacity: 1;
  }
  .marker-halo {
    fill: color-mix(in srgb, var(--accent) 3.92%, transparent);
    stroke: color-mix(in srgb, var(--accent) 14.9%, transparent);
  }
  .marker-core {
    fill: #68799b;
    transition: fill 500ms ease;
  }
  .active .marker-core {
    fill: #c7d2fe;
  }
  .active .marker-halo {
    fill: color-mix(in srgb, var(--accent) 8.24%, transparent);
    stroke: color-mix(in srgb, var(--accent) 50.2%, transparent);
  }
  .location-marker text {
    fill: #bdc9e4;
    font:
      11px Inter,
      sans-serif;
    font-weight: 500;
  }
  .location-marker .country-label {
    fill: #6d809f;
    font:
      7px 'Fira Code Variable',
      monospace;
    letter-spacing: 0.7px;
  }
  .click-ring {
    stroke: #c7d2fe;
    stroke-width: 1;
    transform-origin: 0 0;
    animation: route-click 700ms ease-out infinite;
  }
  @keyframes route-click {
    from {
      scale: 1;
      opacity: 0.8;
    }
    to {
      scale: 2.8;
      opacity: 0;
    }
  }
  .origin-aura {
    stroke: color-mix(in srgb, var(--accent) 10.98%, transparent);
    fill: color-mix(in srgb, var(--accent) 1.18%, transparent);
  }
  .extension-origin text {
    fill: var(--accent-light);
    font:
      8px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.3px;
  }
  .extension-origin .origin-label {
    fill: #687e9f;
    font:
      9px Inter,
      sans-serif;
    letter-spacing: 0;
  }
  .illustration-cursor {
    pointer-events: none;
    filter: drop-shadow(0 3px 4px #02061780);
  }
  .connection-readout {
    display: grid;
    grid-template-columns: 1.15fr 0.65fr 1fr;
    gap: 20px;
    align-items: center;
    margin: 10px 15px 0;
    padding: 20px 0;
    border-top: 1px solid color-mix(in srgb, var(--accent) 14.9%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 10.2%, transparent);
  }
  .connection-readout > div + div {
    border-left: 1px solid color-mix(in srgb, var(--accent) 12.16%, transparent);
    padding-left: 20px;
  }
  .connection-readout > div > span {
    display: block;
    color: #5e7494;
    font:
      7px 'Fira Code Variable',
      monospace;
    letter-spacing: 0.8px;
    margin-bottom: 9px;
  }
  .connection-readout code {
    color: #b7c5df;
    font:
      12px 'Fira Code Variable',
      monospace;
  }
  .connection-readout strong {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #bbc8e3;
    font-size: 14px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .connection-readout small {
    color: #657b9c;
    font-size: 10px;
  }
  @keyframes connection-spin {
    to {
      rotate: 360deg;
    }
  }
  .connection-readout .route-type {
    color: #91a5c5;
    font-size: 12px;
  }
  .connected-location {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 7px;
    margin: 21px 0 0;
    color: #6c819f;
    font-size: 11px;
    line-height: 1.7;
  }
  .connected-location strong {
    color: #b7c8e4;
    font-weight: 400;
  }
  .connected-location :global(svg) {
    color: var(--success-color);
    flex-shrink: 0;
  }
  .connected-location.connecting :global(svg[data-icon='refresh']) {
    color: var(--accent-light);
    animation: connection-spin 1s linear infinite;
  }
  .connected-location .country-flag {
    width: 19px;
    height: 13px;
    border-radius: 2px;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-light) 12.55%, transparent);
  }
  @media (prefers-reduced-motion: reduce) {
    .route-flow.active,
    .click-ring,
    .connected-location.connecting :global(svg[data-icon='refresh']) {
      animation: none;
    }
  }
  @media (max-width: 1050px) and (min-width: 801px) {
    .connection-readout {
      gap: 12px;
      margin-inline: 5px;
    }
    .connection-readout > div + div {
      padding-left: 12px;
    }
  }
  @media (max-width: 500px) {
    .connected-location {
      gap: 5px;
      font-size: 10px;
    }
    .connection-readout .route-type {
      font-size: 10px;
    }
    .connection-readout {
      gap: 10px;
      margin-inline: 0;
      padding-block: 17px;
    }
    .connection-readout > div + div {
      padding-left: 10px;
    }
    .connection-readout code {
      font-size: 10px;
    }
    .connection-readout strong {
      font-size: 12px;
    }
    .connection-readout > div > span {
      font-size: 6px;
      letter-spacing: 0.2px;
    }
  }
  @media (max-width: 360px) {
    .connection-readout {
      grid-template-columns: 1.1fr 0.55fr 1fr;
      gap: 8px;
    }
    .connection-readout > div + div {
      padding-left: 8px;
    }
    .connection-readout code {
      font-size: 9px;
    }
  }
</style>
