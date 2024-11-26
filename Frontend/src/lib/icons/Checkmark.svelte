<script lang="ts">
  let {className = '!cursor-pointer !w-6 !h-6'}: {className?: string | undefined} = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class={className + ' small-icon'}>
  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
</svg>
