<script lang="ts">
  interface Props {
    className?: string | undefined;
  }

  let {className = '!w-6 !h-6 !fill-green-500'}: Props = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class={className + ' small-icon'}>
  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
</svg>
