<script lang="ts">
  let {className = 'h-6! w-6!'}: {className?: string | undefined} = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className + ' small-icon fill-none stroke-current'}>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 9m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
  <path d="M12 14v7" /><path d="M9 18h6" />
</svg>
