<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = '!h-12 !w-12 mr-4 stroke-alert-500'}: Props = $props();
</script>

{#if fill}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    class={className + ' small-icon fill-current !stroke-none'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-6.489 5.8a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z" />
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className + ' small-icon fill-none stroke-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path
      d="M10 10l4 4m0 -4l-4 4" />
  </svg>
{/if}
