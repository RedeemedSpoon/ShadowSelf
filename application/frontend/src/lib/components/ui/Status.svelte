<script lang="ts">
  import Icon from './Icon.svelte';

  let {message, kind = 'info'}: {message: string; kind?: 'info' | 'error' | 'success'} = $props();
</script>

{#if message}<div class="status-message {kind}" role={kind === 'error' ? 'alert' : 'status'}>
    <Icon name={kind === 'error' ? 'warning' : kind === 'success' ? 'check' : 'info'} size={18} /><span>{message}</span>
  </div>{/if}
