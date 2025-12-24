<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = 'h-6! w-6! stroke-primary-600!'}: Props = $props();
</script>

{#if fill}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class={className + ' small-icon fill-current stroke-none!'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M22 10v6a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-6h20zm-14.99 4h-.01a1 1 0 1 0 .01 2a1 1 0 0 0 0 -2zm5.99 0h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0 -2zm5 -10a4 4 0 0 1 4 4h-20a4 4 0 0 1 4 -4h12z" />
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke-linecap="round"
    class={className + ' small-icon fill-none stroke-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10l18 0" /><path
      d="M7 15l.01 0" /><path d="M11 15l2 0" />
  </svg>
{/if}
