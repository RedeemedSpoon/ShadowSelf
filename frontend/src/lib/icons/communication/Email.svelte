<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = 'h-6! w-6!'}: Props = $props();
</script>

{#if fill}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class={className + ' small-icon stroke-none! fill-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" /><path
      d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" />
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    class={className + ' small-icon fill-none stroke-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" />
  </svg>
{/if}
