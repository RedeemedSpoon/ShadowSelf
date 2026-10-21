<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    message,
    kind = 'info',
    ondismiss,
  }: {
    message: string;
    kind?: 'info' | 'error' | 'success';
    ondismiss?: () => void;
  } = $props();
</script>

{#if message}<div class="status-message {kind}" role={kind === 'error' ? 'alert' : 'status'}>
    <Icon name={kind === 'error' ? 'warning' : kind === 'success' ? 'check' : 'info'} size={18} /><span>{message}</span>
    {#if ondismiss}<button class="dismiss-status" type="button" aria-label="Dismiss notice" onclick={ondismiss}
        ><Icon name="close" size={15} /></button
      >{/if}
  </div>{/if}

<style>
  .dismiss-status {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin: -4px -5px -4px auto;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    transition: color 200ms ease;
  }
  .dismiss-status:hover,
  .dismiss-status:focus-visible {
    color: #fb7185;
  }
</style>
