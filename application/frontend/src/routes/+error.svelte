<script lang="ts">
  import {page} from '$app/state';
  import {goto} from '$app/navigation';

  let retrying = $state(false);
  let notFound = $derived(page.status === 404);

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

<section class="error-content">
  <span class="error-code">{page.status}</span>
  <h1>{notFound ? 'Page not found' : 'Unable to load this page'}</h1>
  {#if !notFound}<p>{page.error?.message || 'The service could not complete this request.'}</p>{/if}
  <div class="error-actions">
    <a class="control-button primary" href="/">Return home <span aria-hidden="true">↗</span></a>{#if !notFound}<button
        type="button"
        class="text-link"
        onclick={retry}
        disabled={retrying}>{retrying ? 'Loading…' : 'Try again'}</button
      >{/if}
  </div>
</section>

<style>
  .error-content {
    width: min(720px, calc(100% - 40px));
    margin: auto;
    padding: 80px 0;
    color: #aab6d1;
  }
  .error-code {
    color: var(--accent);
    font:
      13px 'Fira Code Variable',
      monospace;
    border: 1px solid color-mix(in srgb, var(--accent) 25.1%, transparent);
    border-radius: 5px;
    padding: 7px 12px;
  }
  h1 {
    font-size: clamp(34px, 4vw, 54px);
    font-weight: 550;
    letter-spacing: -1.8px;
    line-height: 1.2;
    color: #e6ebff;
    margin: 28px 0 20px;
  }
  p {
    font-size: 15px;
    line-height: 1.9;
    margin: 0;
  }
  .error-actions {
    display: flex;
    gap: 25px;
    align-items: center;
    margin-top: 35px;
  }
  :global(.console) .error-content {
    padding-block: 30px;
    width: 100%;
  }
  @media (max-width: 600px) {
    .error-content {
      padding-block: 56px;
    }
  }
</style>
