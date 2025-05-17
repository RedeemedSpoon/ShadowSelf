<script lang="ts">
  interface Props {
    fill?: boolean;
    className?: string | undefined;
  }

  let {className = 'h-12! w-12!', fill = true}: Props = $props();
</script>

{#if fill}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class={className + ' small-icon'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
    <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
  </svg>
{:else}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" class={className + ' small-icon fill-none'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path
      d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>
{/if}
