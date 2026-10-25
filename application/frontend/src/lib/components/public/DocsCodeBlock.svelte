<script lang="ts">
  import {onDestroy} from 'svelte';
  import {COPY_FEEDBACK_DURATION} from '$constant';
  import Icon from '$component/ui/Icon.svelte';

  let {text, label}: {text: string; label: string} = $props();
  let copied = $state(false);
  let error = $state('');
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => clearTimeout(copyTimer));

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);

      clearTimeout(copyTimer);

      copied = true;
      error = '';
      copyTimer = setTimeout(() => {
        copied = false;
      }, COPY_FEEDBACK_DURATION);
    } catch {
      error = 'Could not copy. Select and copy the text manually.';
    }
  }
</script>

<div class="code-block">
  <div class="code-toolbar">
    <span>{label}</span>
    <button type="button" onclick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
      <Icon name={copied ? 'check' : 'copy'} size={13} />{copied ? 'Copied' : 'Copy'}
    </button>
  </div>
  <pre><code>{text}</code></pre>
</div>
{#if error}<p class="copy-error" role="status">{error}</p>{/if}

<style>
  .code-block {
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #080d1b;
  }
  .code-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    background: #101728;
    border-bottom: 1px solid #ffffff09;
    color: #9baac4;
    font-size: 10px;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 6px 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #9eacc9;
    font-size: 10px;
    cursor: pointer;
  }
  button:hover {
    color: #dce3f7;
    background: var(--neutral-hover);
  }
  button:active {
    color: #c0cbe0;
    background: var(--neutral-pressed);
  }
  button :global(svg) {
    color: inherit;
  }
  pre {
    margin: 0;
    padding: 18px;
    overflow-x: auto;
    color: #bdd4ef;
    font:
      11px/1.8 'Fira Code Variable',
      monospace;
    tab-size: 2;
  }
  code {
    font: inherit;
    white-space: pre;
  }
  .copy-error {
    color: #fbbf24;
    font-size: 11px;
  }
</style>
