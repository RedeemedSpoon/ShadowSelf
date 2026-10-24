<script lang="ts">
  import {page} from '$app/state';
  import {goto} from '$app/navigation';
  import {ERROR_PAGES} from '$constant';
  import Icon from '$component/ui/Icon.svelte';
  import ErrorIllustration from '$component/ui/ErrorIllustration.svelte';

  let retrying = $state(false);
  const design = $derived(
    ERROR_PAGES[page.status as keyof typeof ERROR_PAGES] ?? {
      ...ERROR_PAGES[500],
      label: 'Request failed',
      title: 'Unable to load this page',
      copy: page.error?.message || 'The service could not complete this request.',
    },
  );

  async function retry() {
    retrying = true;

    try {
      await goto(page.url.href, {invalidateAll: true});
    } finally {
      retrying = false;
    }
  }
</script>

<svelte:head><title>{page.status} | ShadowSelf</title><meta name="robots" content="noindex" /></svelte:head>

<section class="error-content" class:centered={design.centered} aria-labelledby="error-title">
  <div class="error-art"><ErrorIllustration scene={design.scene} /></div>
  <div class="error-copy">
    <div class="error-label">
      <span class="status-dot" aria-hidden="true"></span>{page.status}<span class="label-divider" aria-hidden="true"
        >/</span
      >{design.label}
    </div>
    <h1 id="error-title">{design.title}</h1>
    <p>{design.copy}</p>
    <div class="error-actions">
      <a class="control-button primary" href={page.status === 403 || !page.data.user ? '/' : '/dashboard'}
        >{page.status === 403 ? 'Back to homepage' : page.data.user ? 'Back to dashboard' : 'Return home'}<span
          aria-hidden="true">↗</span
        ></a>
      {#if page.status !== 403 && page.status !== 404}
        <button type="button" class="text-link" onclick={retry} disabled={retrying} aria-busy={retrying}
          >{retrying ? 'Loading…' : 'Try again'}<Icon name="refresh" size={17} /></button>
      {/if}
    </div>
  </div>
</section>

<style>
  .error-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(24px, 5vw, 64px);
    width: min(1100px, calc(100% - 48px));
    margin: auto;
    padding: 64px 0 80px;
  }
  .error-art {
    width: 48%;
    max-width: 480px;
    flex-shrink: 0;
    background: radial-gradient(ellipse, #32234c38, transparent 66%);
  }
  .error-copy {
    max-width: 430px;
  }
  .error-label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--link-color);
    font:
      10px 'Fira Code Variable',
      monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .label-divider {
    color: inherit;
  }
  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  h1 {
    font-size: clamp(32px, 3.7vw, 51px);
    font-weight: 530;
    letter-spacing: -1.9px;
    line-height: 1.13;
    color: #e6ebff;
    margin: 24px 0 18px;
  }
  p {
    color: #95a2bc;
    font-size: 14px;
    line-height: 1.9;
    margin: 0;
  }
  .error-actions {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 24px;
    flex-wrap: wrap;
    margin-top: 30px;
  }
  .error-actions .control-button,
  .error-actions .text-link {
    font-size: 12px;
  }
  .error-actions button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .centered {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding-top: 32px;
    padding-bottom: 56px;
  }
  .centered .error-art {
    width: min(340px, 85%);
  }
  .centered .error-copy {
    max-width: 520px;
  }
  .centered .error-label,
  .centered .error-actions {
    justify-content: center;
  }
  :global(.console) .error-content {
    width: 100%;
    padding-block: 40px;
  }
  :global(.console) .error-copy h1 {
    font-size: clamp(32px, 3.7vw, 51px);
    line-height: 1.13;
    margin: 24px 0 18px;
  }
  :global(.console) .error-copy p {
    font-size: 14px;
    line-height: 1.9;
    margin: 0;
  }
  @media (max-width: 700px) {
    .error-content {
      flex-direction: column;
      gap: 12px;
      text-align: center;
      padding: 30px 0 56px;
    }
    .error-art,
    .centered .error-art {
      width: 300px;
      max-width: 100%;
    }
    .error-copy h1,
    :global(.console) .error-copy h1 {
      font-size: 35px;
      letter-spacing: -1.2px;
      margin-top: 20px;
    }
    .error-label {
      font-size: 9px;
    }
    .error-label,
    .error-actions {
      justify-content: center;
    }
    .error-copy p,
    :global(.console) .error-copy p {
      font-size: 13px;
    }
    .error-actions {
      gap: 20px;
      margin-top: 24px;
    }
  }
</style>
