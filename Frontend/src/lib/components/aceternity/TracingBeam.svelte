<script lang="ts">
  import {tweened} from 'svelte/motion';
  import {cubicOut} from 'svelte/easing';
  import {scrollYProgress} from '$store';
  import {onMount} from 'svelte';

  let svgHeight = 0;
  let velo = 0.5;
  let y1 = tweened(50, {duration: 500, easing: cubicOut});
  let y2 = tweened(50, {duration: 500, easing: cubicOut});

  $: {
    velo = $scrollYProgress - velo;
    y1.set($scrollYProgress * (svgHeight - velo * 500));
    y2.set($scrollYProgress * (svgHeight - velo * 2000));
  }

  onMount(() => (svgHeight = window?.innerHeight * 0.75));
</script>

<div class="flex h-full w-full justify-center">
  <div class="absolute left-40 top-32">
    <div
      class="ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border border-neutral-200 shadow-sm"
      style="box-shadow: {$scrollYProgress > 0 ? 'none' : 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}">
      <div class="h-2 w-2 rounded-full border border-neutral-300 bg-neutral-300" />
    </div>
    <svg viewBox={`0 0 20 ${svgHeight}`} width="20" height={svgHeight} class="ml-4" aria-hidden="true">
      <path
        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
        fill="none"
        stroke="#9091A0"
        stroke-opacity="0.16" />
      <path
        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
        fill="none"
        stroke="url(#gradient)"
        stroke-width="4"
        class="motion-reduce:hidden" />
      <defs>
        <linearGradient id="gradient" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={$y1} y2={$y2}>
          <stop stop-color="#18CCFC" stop-opacity="0"></stop>
          <stop stop-color="#18CCFC"></stop>
          <stop offset="0.325" stop-color="#6344F5"></stop>
          <stop offset="1" stop-color="#AE48FF" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
    </svg>
  </div>
  <div class="flex h-5/6 w-5/6 justify-center">
    <slot />
  </div>
</div>
