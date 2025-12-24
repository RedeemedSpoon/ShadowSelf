<script lang="ts">
  import {browser} from '$app/environment';
  import {cubicOut} from 'svelte/easing';
  import {scrollYProgress} from '$store';
  import {Tween} from 'svelte/motion';
  import type {Snippet} from 'svelte';
  import {onMount} from 'svelte';

  let {children}: {children?: Snippet} = $props();

  let svgHeight = $state(0);
  let y1 = new Tween(50, {duration: 500, easing: cubicOut});
  let y2 = new Tween(50, {duration: 500, easing: cubicOut});

  $effect(() => {
    if (browser) {
      y1.set($scrollYProgress * window?.innerHeight * 0.85);
      y2.set($scrollYProgress * window?.innerHeight * 0.5);
    }
  });

  onMount(() => (svgHeight = window?.innerHeight * 0.65));
</script>

<div class="flex h-full w-full justify-center">
  <div class="absolute top-32 left-[6vw] hidden max-h-[40rem] md:block">
    <div
      class="ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border border-neutral-200 shadow-xs"
      style="box-shadow: {$scrollYProgress > 0 ? 'none' : 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}">
      <div class="h-2 w-2 rounded-full border border-neutral-300 bg-neutral-300"></div>
    </div>
    <svg viewBox={`0 0 20 ${svgHeight}`} width="20" height={svgHeight} class="ml-4" aria-hidden="true">
      <path d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`} fill="none" stroke="#9091A0" stroke-opacity="0.16" />
      <path
        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
        fill="none"
        stroke="url(#tracing-gradient)"
        stroke-width="4" />
      <defs>
        <linearGradient id="tracing-gradient" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={y1.target} y2={y2.target}>
          <stop stop-color="#18CCFC" stop-opacity="0"></stop>
          <stop stop-color="#18CCFC"></stop>
          <stop offset="0.325" stop-color="#6344F5"></stop>
          <stop offset="1" stop-color="#AE48FF" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
    </svg>
  </div>
  <div class="flex w-full justify-center xl:w-5/6">
    {@render children?.()}
  </div>
</div>
