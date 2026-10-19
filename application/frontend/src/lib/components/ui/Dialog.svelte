<script lang="ts">
  import type {Snippet} from 'svelte';
  import Button from './Button.svelte';

  let {
    open = $bindable(false),
    title,
    children,
    onclose,
  }: {open?: boolean; title: string; children: Snippet; onclose?: () => void} = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  });

  function close() {
    open = false;
    dialog?.querySelectorAll<HTMLInputElement>('input[type=password]').forEach((input) => {
      input.value = '';
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    onclose?.();
  }
</script>

<dialog bind:this={dialog} onclose={close} oncancel={close} class="console-dialog" aria-label={title}>
  <div class="dialog-heading">
    <h2>{title}</h2>
    <Button variant="quiet" icon="close" aria-label="Close dialog" onclick={close} />
  </div>
  {@render children()}
</dialog>
