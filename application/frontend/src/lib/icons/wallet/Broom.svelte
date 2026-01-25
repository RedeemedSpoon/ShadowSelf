<script lang="ts">
  let {className = 'w-5! h-5! -mr-[2px]'}: {className?: string | undefined} = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className + ' small-icon fill-none stroke-current'}>
  <g transform="translate(2, 2) scale(0.16)">
    <path fill="currentColor" d="M110.97 1.27 70.02 42.73l10.67 10.36 41.25-41.56c3.64-7.83-4.02-14.38-10.97-10.26" />
    <path
      vector-effect="non-scaling-stroke"
      d="M54.04 46.81c.4-.31.81-.58 1.22-.81l.15-.08c2.35-1.28 4.81-1.24 7.39.53l7.17 6.98.11.11 6.6 6.42c2.73 2.78 3.34 5.88 1.83 9.31l-19.35 50.75C24.02 112.99-.34 87.94 0 49.73c19.23 5.62 37.75 7.46 54.04-2.92" />
  </g>
</svg>
