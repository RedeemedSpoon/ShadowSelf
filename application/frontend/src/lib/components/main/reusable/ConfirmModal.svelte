<script lang="ts">
  import {Modal, LoadingButton} from '$component';
  import {ChevronIcon} from '$icon';
  import {modalIndex} from '$store';

  interface Props {
    id: number;
    text: string;
    name?: string;
    fetch?: number;
    onclick?: () => void;
  }

  let {id, text, name, fetch, onclick}: Props = $props();
</script>

<Modal {id}>
  <div class="flex flex-col gap-4 p-4">
    <h1 class="ml-2 text-5xl font-semibold text-neutral-300">Are you sure?</h1>
    <p class="mb-2 text-left">
      {text} is irreversible and could lead to serious consequences.
      <br class="max-md:hidden" /> Are you sure you want to proceed?
    </p>
    <div class="flex justify-end gap-4">
      <button class="alt text-red-700 hover:text-red-800" type="button" onclick={() => ($modalIndex = 0)}>Cancel</button>
      {#if fetch}
        <LoadingButton {name} {onclick} index={fetch} className="text-nowrap disable">Confirm</LoadingButton>
      {:else}
        <button {name} {onclick} class="disable flex items-center gap-1" type="submit">Confirm <ChevronIcon /></button>
      {/if}
    </div>
  </div>
</Modal>
