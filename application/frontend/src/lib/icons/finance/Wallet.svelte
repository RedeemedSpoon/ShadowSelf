<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = 'h-6! w-6! stroke-primary-600!'}: Props = $props();
</script>

{#if fill}
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class={className + ' small-icon fill-current stroke-none!'}>
    <path
      fill-rule="evenodd"
      d="M21,7H5A1,1,0,0,1,5,5H19a1,1,0,0,0,0-2H5A3,3,0,0,0,2,6H2V19a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V8A1,1,0,0,0,21,7ZM18 12.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0 -3Z"
    ></path>
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className + ' small-icon fill-none stroke-current'}>
    <path d="M16.95 14h.1M21 8v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a2 2 0 0 0 2 2Zm0 0H5a2 2 0 0 1-2-2h0a2 2 0 0 1 2-2h14" fill="none" />
  </svg>
{/if}
