<script lang="ts">
  import {tick} from 'svelte';
  import {fly} from 'svelte/transition';
  import {MediaQuery} from 'svelte/reactivity';

  let {
    id,
    name,
    label,
    options,
    compact = false,
    value = $bindable(''),
  }: {
    id: string;
    name?: string;
    label: string;
    options: readonly {value: string; label: string}[];
    value?: string;
    compact?: boolean;
  } = $props();

  let open = $state(false);
  let root: HTMLDivElement;
  let trigger: HTMLButtonElement;
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const selected = $derived(options.find((option) => option.value === value) ?? options[0]);

  async function openOptions() {
    open = true;
    await tick();

    root.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
  }

  function choose(next: string) {
    value = next;
    open = false;
    trigger.focus();
  }

  function handleKey(event: KeyboardEvent) {
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
  <input type="hidden" {name} value={selected.value} />
  <button
    bind:this={trigger}
    {id}
    type="button"
    class="select-trigger"
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
    <span>{selected.label}</span>
    <svg class="chevron" class:open viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 8 8 8 8-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
  {#if open}
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
          aria-selected={option.value === selected.value}
          tabindex={option.value === selected.value ? 0 : -1}
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
  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 46px;
    padding: 13px 15px;
    border: 1px solid #a5b4fc30;
    border-radius: 7px;
    color: #e0e7f9;
    background: #11182c;
    font: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    gap: 12px;
  }
  .select-trigger:focus-visible,
  .select-trigger[aria-expanded='true'] {
    border-color: #818cf8;
  }
  .chevron {
    display: block;
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    transform-origin: center;
    color: #a5b4fc;
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
    border: 1px solid #818cf845;
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
    background: #0b1223;
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
  }
  .select-options button:hover,
  .select-options button:focus-visible {
    background: #818cf81c;
    outline-offset: -2px;
  }
  .select-options button[aria-selected='true'] {
    color: #b5bfff;
    background: #818cf815;
  }
  @media (prefers-reduced-motion: reduce) {
    .chevron {
      transition: none;
    }
  }
</style>
