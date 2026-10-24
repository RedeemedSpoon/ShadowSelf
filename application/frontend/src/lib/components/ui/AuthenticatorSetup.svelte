<script lang="ts">
  import {onDestroy} from 'svelte';
  import Icon from './Icon.svelte';

  let {qr, secret}: {qr: string; secret: string} = $props();
  let copied = $state(false);
  let error = $state('');
  let timer: ReturnType<typeof setTimeout>;

  onDestroy(() => clearTimeout(timer));

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);

      copied = true;
      error = '';
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 2500);
    } catch {
      error = 'Could not copy the secret. Select it and copy it manually.';
    }
  }
</script>

<div class="authenticator-setup">
  <p>Scan the QR code or enter this secret in your authenticator.</p>
  <img class="qr-image" src={qr} alt="Authenticator enrollment QR code" />
  <button class="text-link secret-line" type="button" onclick={copySecret} aria-live="polite">
    <Icon name={copied ? 'check' : 'copy'} size={14} />
    <span
      >{#if copied}Copied!{:else}Secret: <code>{secret}</code>{/if}</span>
  </button>
  {#if error}<small role="alert">{error}</small>{/if}
</div>

<style>
  .authenticator-setup {
    margin-bottom: 20px;
  }
  .secret-line {
    --link-color: color-mix(in srgb, var(--muted) 85%, var(--surface));
    --link-color-hover: color-mix(in srgb, var(--muted) 75%, var(--surface));
    --link-color-pressed: color-mix(in srgb, var(--muted) 65%, var(--surface));
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: fit-content;
    max-width: 100%;
    margin-inline: auto;
    min-height: 36px;
    padding: 6px;
    border-radius: 5px;
    background: transparent;
    font-size: 12px;
  }
  .secret-line code {
    overflow-wrap: anywhere;
  }
  .secret-line::after {
    content: none;
  }
  .secret-line:focus-visible {
    border-color: var(--link-color);
  }
  small {
    display: block;
    margin-top: 8px;
    color: var(--muted);
  }
</style>
