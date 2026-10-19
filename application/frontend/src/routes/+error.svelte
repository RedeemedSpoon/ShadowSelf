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
    <a href="/">Return home <span aria-hidden="true">↗</span></a>{#if !notFound}<button
        type="button"
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
    color: #a599ef;
    font:
      13px 'Fira Code Variable',
      monospace;
    border: 1px solid #a599ef40;
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
  a {
    display: inline-flex;
    gap: 22px;
    align-items: center;
    padding: 13px 20px;
    border: 1px solid #a298ff70;
    border-radius: 7px;
    background: linear-gradient(135deg, #6253ec, #4938c9);
    color: #f3f0ff;
    font-size: 13px;
    text-decoration: none;
  }
  button {
    color: #c0b2f8;
    background: none;
    border: 0;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }
  button:disabled {
    opacity: 0.65;
    cursor: wait;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 2px solid #b7a9ff;
    outline-offset: 5px;
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
