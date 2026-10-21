<script lang="ts">
  import {onMount} from 'svelte';
  import {MediaQuery} from 'svelte/reactivity';
  import {EXTENSION_ROUTE_PREVIEW, EXTENSION_SPEED_HISTORY} from '$constant';

  let {download, upload, connecting}: {download: number; upload: number; connecting: boolean} = $props();
  let scene: SVGGElement;
  let progress = $state(0);
  let histories = $state(
    [EXTENSION_ROUTE_PREVIEW[0].download, EXTENSION_ROUTE_PREVIEW[0].upload].map((rate, direction) =>
      Array.from({length: EXTENSION_SPEED_HISTORY.samples}, (_, index) => {
        const variation = Math.sin(index * (direction ? 0.83 : 0.49)) * 0.15 + Math.cos(index * 1.67) * 0.07;

        return rate * (0.86 + variation);
      }),
    ),
  );
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const spacing = EXTENSION_SPEED_HISTORY.width / (EXTENSION_SPEED_HISTORY.samples - 2);
  const values = $derived(histories.map((history) => history.at(-2)! + (history.at(-1)! - history.at(-2)!) * progress));
  const paths = $derived(
    histories.map((history, direction) =>
      history.map((value, index) => `${index ? 'L' : 'M'}${index * spacing} ${ordinate(value, direction)}`).join(''),
    ),
  );

  function ordinate(value: number, direction: number) {
    return EXTENSION_SPEED_HISTORY.height - (value / EXTENSION_SPEED_HISTORY.ceilings[direction]) * 58 - 3;
  }

  function sample() {
    histories = histories.map((history, direction) => {
      const baseline = direction ? upload : download;
      const variation = connecting ? 0.08 : Math.random() < 0.16 ? 0.4 : 0.7 + Math.random() * 0.42;
      const next = history.at(-1)! * 0.35 + baseline * variation * 0.65;

      return [...history.slice(1), next];
    });
  }

  onMount(() => {
    let visible = false;
    let elapsed = 0;
    let previous = performance.now();
    let frame: number;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });

    observer.observe(scene);

    const animate = (now: number) => {
      const delta = Math.min(now - previous, 100);
      previous = now;

      if (visible && !document.hidden && !reducedMotion.current) {
        elapsed += delta;

        if (elapsed >= EXTENSION_SPEED_HISTORY.interval) {
          elapsed -= EXTENSION_SPEED_HISTORY.interval;
          sample();
        }

        progress = elapsed / EXTENSION_SPEED_HISTORY.interval;
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  });
</script>

<g bind:this={scene}>
  <defs><clipPath id="routing-speed-clip"><rect width="158" height="64" /></clipPath></defs>
  {#each ['Download', 'Upload'] as direction, index (direction)}
    <g class="connection-speed" class:upload={index === 1} transform={`translate(${245 + index * 133} 366)`}>
      <path class="speed-direction" d={index ? 'M0 10V0M-4 4l4-4 4 4' : 'M0 0v10M-4 6l4 4 4-4'} />
      <text class="speed-label" x="12" y="10">{direction}</text>
      <text class="speed-value" y="42">{values[index].toFixed(1)}</text>
      <text class="speed-unit" y="59">Mbps</text>
      <g class="speed-series" transform="translate(0 66) scale(.68 .4)" clip-path="url(#routing-speed-clip)">
        <path class="chart-grid" d="M0 32h158M0 63h158" />
        <g transform={`translate(${-progress * spacing} 0)`}>
          <path class="speed-area" d={`${paths[index]}V64H0Z`} />
          <path class="speed-chart" d={paths[index]} />
        </g>
        <circle class="chart-tip" cx="157" cy={ordinate(values[index], index)} r="2.5" />
      </g>
    </g>
  {/each}
</g>

<style>
  .connection-speed {
    color: #bae6fd;
  }
  .connection-speed.upload {
    color: var(--accent-light);
  }
  .speed-direction {
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .speed-label {
    fill: currentColor;
    font:
      600 14px Inter,
      sans-serif;
    paint-order: stroke;
    stroke: #090f20;
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .speed-value {
    fill: currentColor;
    font:
      500 30px Inter,
      sans-serif;
    letter-spacing: -1px;
    font-variant-numeric: tabular-nums;
    paint-order: stroke;
    stroke: #090f20;
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .speed-unit {
    fill: currentColor;
    font:
      12px 'Fira Code Variable',
      monospace;
  }
  .speed-chart {
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .speed-area {
    fill: currentColor;
    opacity: 0.1;
  }
  .chart-grid {
    stroke: currentColor;
    stroke-width: 0.8;
    opacity: 0.15;
  }
  .chart-tip {
    fill: currentColor;
  }
</style>
