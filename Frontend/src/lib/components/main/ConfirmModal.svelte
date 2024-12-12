<script lang="ts">
  import {showModal} from '$store';
  import {Modal} from '$component';
  import {ChevronIcon} from '$icon';

  interface Props {
    id: number;
    text: string;
  }

  let {id, text}: Props = $props();
</script>

<Modal {id}>
  <div class="flex flex-col gap-4">
    <h1 class="ml-2 text-5xl font-semibold text-neutral-300">Are you sure?</h1>
    <p class="mb-2 text-left">
      {text} is irreversible and could lead to serious consequences.
      <br class="max-md:hidden" /> Are you sure you want to proceed?
    </p>
    <div class="flex justify-end gap-4">
      <button class="alt text-red-700 hover:text-red-800" type="button" onclick={() => ($showModal = 0)}>Cancel</button>
      <button class="disable flex items-center gap-1" type="submit">Confirm <ChevronIcon /></button>
    </div>
  </div>
</Modal>
