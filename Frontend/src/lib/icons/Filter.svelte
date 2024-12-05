<script lang="ts">
  let {
    className = '!h-8 !w-8 fill-neutral-400 stroke-neutral-400 hover:stroke-neutral-300 hover:fill-neutral-300',
  }: {className?: string | undefined} = $props();
  let isFtr = $state(true);
</script>

<div aria-hidden="true" onclick={() => (isFtr = !isFtr)}>
  {#if isFtr}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke-width="2"
      class={className + ' small-icon !fill-none stroke-current'}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
        d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
    </svg>
  {:else}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" class={className + ' small-icon stroke-current'}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
        d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
    </svg>
  {/if}
</div>
