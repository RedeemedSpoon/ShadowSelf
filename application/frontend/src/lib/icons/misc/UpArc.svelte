<script lang="ts">
  let {className}: {className?: string | undefined} = $props();
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
  <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 15v-12" /><path d="M16 7l-4 -4l-4 4" />
  <path d="M3 12a9 9 0 0 0 18 0" />
</svg>
