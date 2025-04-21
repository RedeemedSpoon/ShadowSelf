<script lang="ts">
  let {className = 'h-5! w-5! stroke-neutral-300'}: {className?: string | undefined} = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className + ' fill-none stroke-current'}>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path
    d="M11 13l9 -9" /><path d="M15 4h5v5" />
</svg>
