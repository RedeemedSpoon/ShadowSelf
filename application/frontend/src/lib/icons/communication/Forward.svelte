<script lang="ts">
  let {className}: {className?: string | undefined} = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className + ' small-icon fill-none stroke-current'}>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 14l-4 -4l4 -4" /><path d="M8 14l-4 -4l4 -4" /><path
    d="M9 10h7a4 4 0 1 1 0 8h-1" />
</svg>
