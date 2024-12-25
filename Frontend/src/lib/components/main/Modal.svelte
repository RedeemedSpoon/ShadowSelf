<script lang="ts">
  import type {Snippet} from 'svelte';
  import {showModal} from '$store';

  interface Props {
    children: Snippet;
    id?: number;
  }

  let {children, id = 1}: Props = $props();
  let hide = $state(true);

  $effect(() => {
    hide = $showModal !== id;
  });
</script>

<div id="modal-overlay" onclick={() => ($showModal = 0)} aria-hidden="true" class={hide ? 'hidden' : 'no-scroll'}></div>
<div id="modal" class:!hidden={hide}>
  {@render children?.()}
</div>

<style lang="postcss">
  #modal-overlay {
    @apply fixed inset-0 z-50 bg-black/40;
  }

  #modal {
    @apply fixed inset-0 z-[60] m-auto flex h-fit w-fit items-center justify-center;
    @apply rounded-xl bg-neutral-800/95 p-8 shadow-2xl shadow-gray-950/50 backdrop-blur-sm;
  }
</style>
