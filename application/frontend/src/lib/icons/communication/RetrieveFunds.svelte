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
  <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 9.5l-3 1.5l8 4l8 -4l-3 -1.5" /><path d="M4 15l8 4l8 -4" /><path
    d="M12 11v-7" /><path d="M9 7l3 -3l3 3" />
</svg>
