<script lang="ts" generics="Value extends string">
  import {tick} from 'svelte';
  import {fly} from 'svelte/transition';
  import {MediaQuery} from 'svelte/reactivity';

  let {
    id,
    name,
    label,
    options,
    compact = false,
    value = $bindable('' as Value),
    disabled = false,
    required = false,
    placeholder = 'Select an option',
    onchange,
  }: {
    id: string;
    name?: string;
    label: string;
    options: readonly {value: Value; label: string}[];
    value?: Value;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    onchange?: (value: Value) => void;
    compact?: boolean;
  } = $props();

  let open = $state(false);
  let invalid = $state(false);
  let root: HTMLDivElement;
  let trigger: HTMLButtonElement;
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const selected = $derived(options.find((option) => option.value === value));

  async function openOptions() {
    if (disabled || options.length === 0) {
      return;
    }

    open = true;
    await tick();

    const option =
      root.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
      root.querySelector<HTMLButtonElement>('[role="option"]');

    option?.focus();
  }

  function choose(next: Value) {
    if (disabled) {
      return;
    }

    const changed = next !== value;

    value = next;
    invalid = false;
    open = false;
    trigger.focus();

    if (changed) {
      onchange?.(next);
    }
  }

  function handleKey(event: KeyboardEvent) {
    if (disabled || options.length === 0) {
      return;
    }

    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'];

    if (!keys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'Escape') {
      open = false;
      trigger.focus();
      return;
    }

    if (!open) {
      void openOptions();
      return;
    }

    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = (current + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;

    if (event.key === 'Home' || event.key === 'End') {
      next = event.key === 'Home' ? 0 : buttons.length - 1;
    }

    buttons[next]?.focus();
  }
</script>

<svelte:document
  onclick={(event) => {
    if (open && event.target instanceof Node && !root.contains(event.target)) {
      open = false;
    }
  }} />

<div
  class="select"
  class:compact
  bind:this={root}
  onfocusout={(event) => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      open = false;
    }
  }}>
  <input
    class="select-validation"
    type="text"
    autocomplete="off"
    {name}
    value={selected?.value ?? ''}
    {required}
    {disabled}
    tabindex="-1"
    aria-hidden="true"
    oninvalid={(event) => {
      event.preventDefault();
      invalid = true;
      trigger.focus();
    }} />
  <button
    bind:this={trigger}
    {id}
    type="button"
    class="select-trigger"
    role="combobox"
    {disabled}
    aria-invalid={invalid || undefined}
    aria-required={required || undefined}
    aria-label={label}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={`${id}-options`}
    onkeydown={handleKey}
    onclick={() => {
      if (open) {
        open = false;
      } else {
        void openOptions();
      }
    }}>
    <span>{selected?.label ?? placeholder}</span>
    <svg class="chevron" class:open viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 8 8 8 8-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
  {#if open && !disabled}
    <div
      id={`${id}-options`}
      class="select-options"
      role="listbox"
      aria-label={label}
      transition:fly={{y: -5, duration: reducedMotion.current ? 0 : 160}}>
      {#each options as option (option.value)}
        <button
          type="button"
          role="option"
          aria-selected={option.value === selected?.value}
          tabindex={option.value === selected?.value ? 0 : -1}
          onkeydown={handleKey}
          onclick={() => choose(option.value)}>
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .select {
    position: relative;
    min-width: 0;
  }
  .select-validation {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
    padding: 0;
    border: 0;
    clip-path: inset(50%);
  }
  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    text-align: left;
    cursor: pointer;
    gap: 12px;
  }
  .chevron {
    display: block;
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    transform-origin: center;
    color: var(--accent-light);
    transition: transform 180ms ease;
  }
  .chevron.open {
    transform: rotate(180deg);
  }
  .select-options {
    position: absolute;
    z-index: 20;
    inset: calc(100% + 8px) 0 auto;
    padding: 5px;
    border: 1px solid color-mix(in srgb, var(--accent) 27.06%, transparent);
    border-radius: 8px;
    background: #141d32;
    box-shadow: 0 12px 32px #02061780;
    max-height: min(320px, 50dvh);
    overflow-y: auto;
  }
  .compact .select-trigger {
    height: 42px;
    padding: 11px 12px;
    font-size: 12px;
  }
  .select-options button {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 11px 10px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: #cbd5ed;
    text-align: left;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition:
      color 180ms ease,
      background-color 180ms ease;
  }
  .select-options button:hover,
  .select-options button:focus-visible {
    background: color-mix(in srgb, var(--accent) 10.98%, transparent);
    outline-offset: -2px;
  }
  .select-options button[aria-selected='true'] {
    color: var(--accent-light);
    background: color-mix(in srgb, var(--accent) 8.24%, transparent);
  }
  @media (prefers-reduced-motion: reduce) {
    .chevron {
      transition: none;
    }
  }
</style>
