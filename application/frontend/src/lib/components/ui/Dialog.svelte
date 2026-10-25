<script lang="ts">
  import type {Snippet} from 'svelte';
  import Icon from './Icon.svelte';

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
    <button type="button" class="dialog-close" aria-label="Close dialog" onclick={close}
      ><Icon name="close" size={16} /></button>
  </div>
  {@render children()}
</dialog>

<style>
  .dialog-close :global(svg) {
    color: inherit;
  }
  .console-dialog .dialog-heading h2 {
    margin: 0;
    font-size: 19px;
    line-height: 1.3;
  }
  .console-dialog .dialog-heading .dialog-close {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    min-height: 26px;
    padding: 0;
    gap: 0;
    flex-shrink: 0;
    color: var(--muted);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    box-shadow: none;
    filter: none;
    transform: none;
    transition: color 200ms ease;
  }
  .console-dialog .dialog-heading .dialog-close:is(:hover, :focus-visible) {
    color: #dce3f7;
    background: var(--neutral-hover);
  }
  .console-dialog .dialog-heading .dialog-close:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--muted) 20%, transparent);
  }
  .console-dialog .dialog-heading .dialog-close:active {
    color: #e6ebff;
    background: var(--neutral-pressed);
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
