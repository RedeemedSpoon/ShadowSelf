<script lang="ts">
  import {onDestroy, type Snippet} from 'svelte';
  import Status from './Status.svelte';
  import Button from './Button.svelte';

  let {
    value,
    label = 'Copy',
    concealed = false,
    stacked = false,
    actions,
  }: {
    value: string;
    label?: string;
    concealed?: boolean;
    stacked?: boolean;
    actions?: Snippet;
  } = $props();
  let copied = $state(false);
  let error = $state('');
  let timer: ReturnType<typeof setTimeout>;

  onDestroy(() => clearTimeout(timer));

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      error = '';
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 2000);
    } catch {
      error = 'Could not copy to clipboard.';
    }
  }
</script>

<div class="copy-value" class:stacked>
  <code>{concealed ? '••••••••••••' : value}</code>
  <div class="copy-actions">
    <Button variant="quiet" icon={copied ? 'check' : 'copy'} onclick={copy} aria-label={label}>
      {copied ? 'Copied' : label}
    </Button>
    {@render actions?.()}
  </div>
</div>
<Status message={error} kind="error" />

<style>
  .copy-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 10px;
  }
  .copy-value.stacked {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 18px;
  }
  .stacked code {
    display: block;
    width: 100%;
    padding-bottom: 4px;
    white-space: nowrap;
    overflow-wrap: normal;
    overflow-x: auto;
  }
</style>
