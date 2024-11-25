<script lang="ts">
  let {className = '!h-12 !w-12'}: {className?: string | undefined} = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className + ' small-icon'}>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12l8 -4.5" /><path d="M12 12v9" /><path
    d="M12 12l-8 -4.5" /><path d="M12 12l8 4.5" /><path d="M12 3v9" /><path d="M12 12l-8 4.5" />
</svg>
