<script lang="ts">
  import type {Snippet} from 'svelte';
  import Icon from './Icon.svelte';

  let {
    message,
    kind = 'info',
    ondismiss,
    children,
  }: {
    message: string;
    kind?: 'info' | 'error' | 'success';
    ondismiss?: () => void;
    children?: Snippet;
  } = $props();
</script>

{#if message}<div class="status-message {kind}" role={kind === 'error' ? 'alert' : 'status'}>
    <Icon name={kind === 'error' ? 'warning' : kind === 'success' ? 'check' : 'info'} size={18} /><span
      >{#if children}{@render children()}{:else}{message}{/if}</span>
    {#if ondismiss}<button class="dismiss-status" type="button" aria-label="Dismiss notice" onclick={ondismiss}
        ><Icon name="close" size={15} /></button
      >{/if}
  </div>{/if}

<style>
  .dismiss-status :global(svg) {
    color: inherit;
  }
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
    color: var(--muted);
    transition: color 200ms ease;
  }
  .dismiss-status:hover,
  .dismiss-status:focus-visible {
    color: #dce3f7;
    background: var(--neutral-hover);
  }
  .dismiss-status:active {
    color: #e6ebff;
    background: var(--neutral-pressed);
  }
</style>
