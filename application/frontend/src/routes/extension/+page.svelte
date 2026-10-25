<script lang="ts">
  import ExtensionRouting from '$component/extension/ExtensionRouting.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import {EXTENSION_STORES} from '$constant';

  let storesExpanded = $state(false);
  let download: HTMLDivElement;
  let storesButton: HTMLButtonElement;
</script>

<svelte:head>
  <title>Browser extension | ShadowSelf</title>
  <meta
    name="description"
    content="Keep your ShadowSelf identities within reach while browsing. Get the browser extension." />
</svelte:head>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && storesExpanded) {
      storesExpanded = false;
      storesButton.focus();
    }
  }} />

<svelte:document
  onclick={(event) => {
    if (storesExpanded && event.target instanceof Node && !download.contains(event.target)) {
      storesExpanded = false;
    }
  }} />

<section class="extension-page">
  <div class="extension-copy">
    <h1>Your identities.<br /><span>Within reach.</span></h1>
    <p>
      Keep your identities close while you browse. Open their profiles, messages, and account vaults from the extension,
      manage residential routing, and reach their wallets, virtual cards, and files.
    </p>
    <div
      class="extension-download"
      bind:this={download}
      onfocusout={(event) => {
        if (!download.contains(event.relatedTarget as Node | null)) {
          storesExpanded = false;
        }
      }}>
      <div class="primary-action download-control">
        <a class="extension-action" href={EXTENSION_STORES[0].href} target="_blank" rel="noreferrer">
          Add to Firefox <Icon name="download" size={17} />
        </a>
        <button
          type="button"
          class="control-button browser-toggle"
          bind:this={storesButton}
          aria-label="Other browsers"
          aria-expanded={storesExpanded}
          aria-controls="browser-stores"
          onclick={() => {
            storesExpanded = !storesExpanded;
          }}>
          <Icon name="chevron" size={18} />
        </button>
      </div>
      <div
        id="browser-stores"
        class="browser-stores"
        class:expanded={storesExpanded}
        inert={!storesExpanded}
        aria-hidden={!storesExpanded}>
        {#each EXTENSION_STORES.slice(1) as store (store.browser)}
          <a href={store.href} target="_blank" rel="noreferrer" onclick={() => (storesExpanded = false)}
            >Add to {store.browser} <Icon name="external" size={15} /></a>
        {/each}
      </div>
    </div>
  </div>
  <ExtensionRouting />
</section>

<style>
  .extension-download {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    border-radius: 7px;
  }
  .download-control {
    overflow: clip;
    padding: 0;
    gap: 0;
  }
  .extension-action {
    display: inline-flex;
    align-items: center;
    gap: var(--control-icon-gap);
    padding: 15px 25px;
    min-height: 52px;
    color: inherit;
  }
  .browser-toggle {
    display: grid;
    place-items: center;
    align-self: stretch;
    padding-inline: 14px;
    background: transparent;
    color: inherit;
    border: 0;
    border-left: 1px solid #ffffff18;
    border-radius: 0;
  }
  .download-control:has(:focus-visible) {
    box-shadow: var(--control-focus-shadow);
  }
  .browser-toggle :global(svg) {
    transform: rotate(0deg);
    transition: transform 180ms ease;
  }
  .browser-toggle[aria-expanded='true'] :global(svg) {
    transform: rotate(180deg);
  }
  .browser-stores {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 5;
    padding: 6px;
    border: 1px solid color-mix(in srgb, var(--accent-light) 18.82%, transparent);
    border-radius: 8px;
    background: #11182a;
    box-shadow: 0 15px 35px #0005;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-7px);
    pointer-events: none;
    transition:
      opacity 180ms ease,
      transform 180ms ease,
      visibility 0s linear 180ms;
  }
  .browser-stores.expanded {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
    transition-delay: 0s;
  }
  .browser-stores a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 5px;
    color: #dce3f7;
    font-size: 13px;
    transition: background 180ms ease;
  }
  .browser-stores a:is(:hover, :focus-visible) {
    background: var(--neutral-hover);
  }
  .browser-stores a:active {
    background: var(--neutral-pressed);
  }

  .extension-copy {
    position: relative;
    z-index: 2;
  }
  .extension-page {
    width: min(1160px, calc(100% - 80px));
    margin-inline: auto;
    min-height: calc(100svh - var(--public-header-height));
    display: grid;
    grid-template-columns: 0.88fr 1.12fr;
    align-items: center;
    gap: 64px;
    padding-block: 80px;
  }
  h1 {
    margin: 0 0 26px;
    color: #e6ebff;
    font-size: clamp(40px, 4.5vw, 64px);
    line-height: 1.12;
    font-weight: 550;
    letter-spacing: -2px;
  }
  h1 span {
    color: var(--accent);
  }
  p {
    max-width: 460px;
    color: #aab6d1;
    font-size: 15px;
    line-height: 1.9;
    margin: 0 0 30px;
    text-wrap: pretty;
  }
  @media (prefers-reduced-motion: reduce) {
    .browser-stores,
    .browser-toggle :global(svg) {
      transition: none;
    }
  }
  @media (max-width: 800px) {
    .extension-page {
      width: calc(100% - 40px);
      grid-template-columns: 1fr;
      gap: 35px;
      padding-block: 60px 45px;
    }
    .extension-copy {
      max-width: 520px;
      margin-inline: auto;
      text-align: center;
    }
    h1 {
      font-size: 43px;
    }
    p {
      margin-inline: auto;
      font-size: 14px;
    }
  }
</style>
