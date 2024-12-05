<script lang="ts">
  let {className = '!h-8 !w-8 stroke-neutral-400 hover:stroke-neutral-300'}: {className?: string | undefined} = $props();
  let isAsc = $state(true);
</script>

<div aria-hidden="true" onclick={() => (isAsc = !isAsc)}>
  {#if isAsc}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke-linecap="round"
      class={className + ' small-icon fill-none stroke-current'}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l7 0" /><path d="M4 12l7 0" /><path d="M4 18l9 0" /><path
        d="M15 9l3 -3l3 3" /><path d="M18 6l0 12" />
    </svg>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke-linecap="round"
      class={className + ' small-icon fill-none stroke-current'}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l9 0" /><path d="M4 12l7 0" /><path d="M4 18l7 0" /><path
        d="M15 15l3 3l3 -3" /><path d="M18 6l0 12" />
    </svg>
  {/if}
</div>
