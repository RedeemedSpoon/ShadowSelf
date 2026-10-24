<script lang="ts">
  import {onDestroy} from 'svelte';
  import Button from './Button.svelte';

  let {codes}: {codes: string[]} = $props();
  let copied = $state(false);
  let downloaded = $state(false);
  let error = $state('');
  let copyTimer: ReturnType<typeof setTimeout>;
  let downloadTimer: ReturnType<typeof setTimeout>;

  onDestroy(() => {
    clearTimeout(copyTimer);
    clearTimeout(downloadTimer);
  });

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));

      copied = true;
      error = '';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 2500);
    } catch {
      error = 'Could not copy the codes. Download them or copy them manually.';
    }
  }

  function downloadCodes() {
    const file = new Blob([`ShadowSelf recovery codes\n\n${codes.join('\n')}\n`], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'shadowself-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);

    downloaded = true;
    clearTimeout(downloadTimer);
    downloadTimer = setTimeout(() => (downloaded = false), 2500);
  }
</script>

<div class="recovery-codes">
  {#each codes as code (code)}<span>{code}</span>{/each}
</div>
<div class="recovery-actions">
  <Button variant="secondary" icon={downloaded ? 'check' : 'download'} onclick={downloadCodes} aria-live="polite">
    {downloaded ? 'Downloaded!' : 'Download'}
  </Button>
  <Button variant="secondary" icon={copied ? 'check' : 'copy'} onclick={copyCodes} aria-live="polite">
    {copied ? 'Copied!' : 'Copy'}
  </Button>
</div>
{#if error}<small role="alert">{error}</small>{/if}

<style>
  .recovery-codes {
    justify-items: center;
    background: linear-gradient(145deg, #060b18, #0c1222);
    box-shadow:
      inset 0 2px 8px #02050f80,
      0 1px 0 #ffffff05;
    margin-bottom: 12px;
  }
  .recovery-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }
  small {
    display: block;
    margin-bottom: 16px;
    color: var(--muted);
  }
</style>
