<script lang="ts">
  import type {Snippet} from 'svelte';
  import {modalIndex} from '$store';

  interface Props {
    children: Snippet;
    id?: number;
  }

  let {children, id = 1}: Props = $props();
  let hide = $state(true);

  $effect(() => {
    hide = $modalIndex !== id;
  });
</script>

<div id="backdrop" onclick={() => ($modalIndex = 0)} aria-hidden="true" class={hide ? 'hidden' : 'no-scroll'}></div>
<div id="modal" class:!hidden={hide}>
  {@render children?.()}
</div>

<style lang="postcss">
  #backdrop {
    @apply fixed inset-0 z-50 h-full w-full bg-black/40;
  }

  #modal {
    @apply z-60 fixed inset-0 m-auto flex h-fit w-fit items-center justify-center self-center;
    @apply backdrop-blur-xs rounded-xl bg-neutral-800/95 p-4 shadow-2xl shadow-gray-950/50 max-sm:mx-4 sm:p-8;
  }
</style>
