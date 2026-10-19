<script lang="ts">
  import Button from './Button.svelte';

  let {value, label = 'Copy', concealed = false}: {value: string; label?: string; concealed?: boolean} = $props();
  let copied = $state(false);
  let error = $state('');
  let timer: ReturnType<typeof setTimeout>;

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

<div class="copy-value">
  <code>{concealed ? '••••••••••••' : value}</code><Button
    variant="quiet"
    icon={copied ? 'check' : 'copy'}
    onclick={copy}
    aria-label={label}>{copied ? 'Copied' : label}</Button>
</div>
{#if error}<small role="alert">{error}</small>{/if}
