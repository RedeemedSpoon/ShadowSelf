<script lang="ts">
  import type {Snippet} from 'svelte';
  import Button from './Button.svelte';

  let {
    open = $bindable(false),
    title,
    children,
    onclose,
    wide = false,
    fit = false,
  }: {
    open?: boolean;
    title: string;
    children: Snippet;
    onclose?: () => void;
    wide?: boolean;
    fit?: boolean;
  } = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (!open || !fit) {
      return;
    }

    const position = window.scrollY;
    const root = document.documentElement;
    root.style.setProperty('--dialog-scroll-offset', `${-position}px`);

    return () => {
      root.style.removeProperty('--dialog-scroll-offset');
      queueMicrotask(() => window.scrollTo({top: position, behavior: 'instant'}));
    };
  });

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

  function dismissBackdrop(event: PointerEvent) {
    if (!open || event.target !== dialog) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();

    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      event.preventDefault();
      close();
    }
  }
</script>

<svelte:window onpointerdown={dismissBackdrop} />

<dialog
  bind:this={dialog}
  onclose={close}
  oncancel={close}
  class="console-dialog"
  class:wide
  class:fit
  aria-label={title}>
  <div class="dialog-heading">
    <h2>{title}</h2>
    <Button variant="quiet" class="dialog-close" icon="close" aria-label="Close dialog" onclick={close} />
  </div>
  {@render children()}
</dialog>

<style>
  .console-dialog .dialog-heading :global(.dialog-close) {
    color: var(--muted);
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    filter: none;
    transform: none;
    transition: color 200ms ease;
  }
  .dialog-heading :global(.dialog-close:hover),
  .dialog-heading :global(.dialog-close:focus-visible) {
    color: #fb7185;
  }

  :global(html:has(.console-dialog.fit)) {
    scrollbar-gutter: stable;
  }
  :global(html:has(.console-dialog.fit:modal)) {
    overflow: hidden;
  }
  :global(html:has(.console-dialog.fit:modal) body) {
    position: fixed;
    top: var(--dialog-scroll-offset);
    width: 100%;
    overflow: hidden;
  }
  .console-dialog.fit[open] {
    display: flex;
    flex-direction: column;
    gap: 18px;
    height: min(900px, calc(80vw + 160px), calc(100dvh - 48px));
    overflow: hidden;
    overscroll-behavior: contain;
  }
  .console-dialog.fit .dialog-heading {
    flex-shrink: 0;
    margin-bottom: 0;
  }
  .console-dialog.wide {
    width: min(1200px, calc(100vw - 32px));
  }
</style>
