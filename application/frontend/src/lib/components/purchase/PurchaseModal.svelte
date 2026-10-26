<script lang="ts">
  import {onDestroy, type Snippet} from 'svelte';
  import Icon from '$component/ui/Icon.svelte';

  let {
    open = $bindable(false),
    title,
    label = 'SHADOWSELF PAYMENTS',
    children,
    ondismiss,
    wide = false,
  }: {
    open?: boolean;
    title: string;
    label?: string;
    children: Snippet;
    ondismiss?: () => void;
    wide?: boolean;
  } = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  onDestroy(() => {
    open = false;
    dialog?.close();
  });

  function dismiss() {
    if (!open) {
      return;
    }

    open = false;
    ondismiss?.();
  }
</script>

<svelte:window
  onpointerdown={(event) => {
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
      dismiss();
    }
  }} />

<dialog
  bind:this={dialog}
  class="purchase-modal"
  class:wide
  aria-label={title}
  oncancel={(event) => {
    event.preventDefault();
    dismiss();
  }}
  onclose={dismiss}>
  <header>
    <div>
      <span class="modal-label">{label}</span>
      <h2>{title}</h2>
    </div>
    <button type="button" class="modal-close" aria-label="Close dialog" onclick={dismiss}
      ><Icon name="close" size={16} /></button>
  </header>
  <div class="modal-content">{@render children()}</div>
</dialog>

<style>
  .purchase-modal {
    width: min(590px, calc(100vw - 32px));
    max-height: calc(100dvh - 40px);
    margin: auto;
    padding: 28px;
    overflow: auto;
    overscroll-behavior: contain;
    color: #e6ebff;
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-radius: 14px;
    background: radial-gradient(ellipse at 90% 0%, #4938c924, transparent 70%), #10172a;
    box-shadow:
      0 32px 100px #0008,
      inset 0 1px 0 #ffffff08;
  }
  .purchase-modal.wide {
    width: min(690px, calc(100vw - 32px));
  }
  .purchase-modal::backdrop {
    background: #030714c9;
    backdrop-filter: blur(7px);
  }
  .purchase-modal[open] {
    animation: modal-appear 180ms ease-out;
  }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;
  }
  .modal-label {
    display: block;
    color: var(--accent-light);
    font:
      9px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.8px;
    margin-bottom: 10px;
  }
  .purchase-modal h2 {
    color: #e4dfff;
    font-size: 24px;
    font-weight: 550;
    line-height: 1.2;
    letter-spacing: -0.7px;
    margin: 0;
  }
  .modal-close {
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
  .modal-close:is(:hover, :focus-visible) {
    color: #dce3f7;
    background: var(--neutral-hover);
  }
  .modal-close:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--muted) 20%, transparent);
  }
  .modal-close:active {
    color: #e6ebff;
    background: var(--neutral-pressed);
  }
  .modal-content {
    min-width: 0;
  }
  .modal-content :global(svg) {
    color: currentColor;
  }
  .modal-content :global(.field) {
    margin-bottom: 18px;
  }
  .modal-content :global(.field label) {
    color: #bbb3dd;
    font-size: 12px;
    margin-bottom: 9px;
  }
  .modal-content :global(.field input) {
    min-height: 46px;
    background: #0c1222;
    font-size: 14px;
    border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  }
  .modal-content :global(.purchase-error) {
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--danger-color) 30%, transparent);
    border-radius: 6px;
    background: var(--danger-surface);
    color: #d4a4ae;
    font-size: 12px;
    line-height: 1.7;
    margin: 0 0 18px;
  }
  :global(html:has(.purchase-modal:modal)) {
    overflow: hidden;
    scrollbar-gutter: stable;
  }
  @keyframes modal-appear {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (max-width: 600px) {
    .purchase-modal {
      padding: 22px;
      border-radius: 11px;
    }
    .purchase-modal h2 {
      font-size: 22px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .purchase-modal[open] {
      animation: none;
    }
  }
</style>
