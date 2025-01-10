<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = '!h-12 !w-12 mr-4 stroke-success-500'}: Props = $props();
</script>

{#if !fill}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    class={className + ' small-icon fill-current !stroke-none'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" />
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className + ' small-icon !fill-none stroke-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path
      d="M9 12l2 2l4 -4" />
  </svg>
{/if}
