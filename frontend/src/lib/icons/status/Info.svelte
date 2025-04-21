<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = 'h-12! w-12! mr-4 stroke-info-500'}: Props = $props();
</script>

{#if fill}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    class={className + ' small-icon stroke-none! fill-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336m-5 11.66a1 1 0 0 0 -1 1v.01a1 1 0 0 0 2 0v-.01a1 1 0 0 0 -1 -1m0 -7a1 1 0 0 0 -1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0 -1 -1" />
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
      d="M12 9v4" /><path d="M12 16v.01" />
  </svg>
{/if}
