<script lang="ts">
  interface Props {
    className?: string | undefined;
    fill?: boolean;
  }

  let {fill = false, className = '!h-6 !w-6 !stroke-primary-600'}: Props = $props();
</script>

{#if fill}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class={className + ' small-icon fill-current stroke-none'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M9 3a1 1 0 0 1 .877 .519l.051 .11l2 5a1 1 0 0 1 -.313 1.16l-.1 .068l-1.674 1.004l.063 .103a10 10 0 0 0 3.132 3.132l.102 .062l1.005 -1.672a1 1 0 0 1 1.113 -.453l.115 .039l5 2a1 1 0 0 1 .622 .807l.007 .121v4c0 1.657 -1.343 3 -3.06 2.998c-8.579 -.521 -15.418 -7.36 -15.94 -15.998a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke-width="2"
    class={className + ' small-icon fill-none stroke-current'}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
      d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
  </svg>
{/if}
