<script lang="ts">
  import type {Snippet} from 'svelte';

  let {
    eyebrow = '',
    title,
    description = '',
    children,
    wide = false,
    centered = false,
    sidebar,
  }: {
    eyebrow?: string;
    title: string;
    description?: string;
    children: Snippet;
    wide?: boolean;
    centered?: boolean;
    sidebar?: Snippet;
  } = $props();
</script>

<div class="public-page" class:wide class:with-sidebar={Boolean(sidebar)}>
  {#if sidebar}<aside class="page-sidebar">{@render sidebar()}</aside>{/if}
  <div class="page-introduction" class:centered>
    {#if eyebrow}<span class="page-eyebrow">{eyebrow}</span>{/if}
    <h1>{title}</h1>
    {#if description}<p>{description}</p>{/if}
  </div>
  <div class="page-content">{@render children()}</div>
</div>

<style>
  .public-page {
    width: min(820px, calc(100% - 80px));
    margin-inline: auto;
    padding: 72px 0 88px;
    color: #aab6d1;
  }
  .public-page.wide {
    width: min(1160px, calc(100% - 80px));
  }
  .public-page.with-sidebar {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    column-gap: 65px;
  }
  .with-sidebar .page-introduction,
  .with-sidebar .page-content {
    grid-column: 2;
    min-width: 0;
  }
  .page-sidebar {
    grid-column: 1;
    grid-row: 1 / span 2;
    position: sticky;
    top: calc(var(--public-header-height) + 24px);
    align-self: start;
    max-height: calc(100dvh - var(--public-header-height) - 48px);
    overflow-y: auto;
  }
  .page-introduction {
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  .page-introduction.centered {
    text-align: center;
    margin-bottom: 44px;
  }
  :global(.public-page h1),
  :global(.public-page label) {
    user-select: text;
    -webkit-user-select: text;
  }
  .page-eyebrow {
    color: #ad9ef4;
    font:
      11px 'Fira Code Variable',
      monospace;
    letter-spacing: 1px;
  }
  h1 {
    margin: 0;
    font-size: clamp(32px, 4vw, 48px);
    line-height: 1.12;
    letter-spacing: -1.8px;
    font-weight: 550;
    color: #e6ebff;
    background: none;
    -webkit-text-fill-color: currentColor;
  }
  .page-introduction > p {
    margin-top: 18px;
    max-width: 650px;
    font-size: 16px;
    line-height: 1.9;
  }
  .page-eyebrow + h1 {
    margin-top: 16px;
  }
  :global(.public-page p) {
    margin: 0 0 18px;
    line-height: 1.9;
    text-wrap: pretty;
  }
  :global(.public-page h2) {
    color: #e1e7f8;
    font-size: 25px;
    font-weight: 500;
    line-height: 1.4;
    margin: 42px 0 18px;
    background: none;
    -webkit-text-fill-color: currentColor;
  }
  :global(.public-page h3) {
    color: #d8e0f5;
    font-size: 18px;
    font-weight: 500;
    line-height: 1.5;
    margin: 26px 0 12px;
  }
  :global(.public-page a) {
    color: #bbacf8;
    text-decoration-color: #bbacf855;
    text-underline-offset: 5px;
  }
  :global(.public-page a:hover) {
    color: #e2dcff;
  }
  :global(.public-page a:focus-visible),
  :global(.public-page summary:focus-visible),
  :global(.public-page button:focus-visible) {
    outline: 2px solid #b7a9ff;
    outline-offset: 5px;
  }
  :global(.public-page ul),
  :global(.public-page ol) {
    padding-left: 24px;
    margin-block: 20px;
  }
  :global(.public-page li) {
    margin-bottom: 12px;
    line-height: 1.85;
  }
  :global(.public-page ul) {
    list-style: disc;
  }
  :global(.public-page ol) {
    list-style: decimal;
  }
  :global(.public-page strong) {
    color: #dce3f7;
    font-weight: 550;
  }
  :global(.public-page .policy-note) {
    padding: 23px 26px;
    border-left: 2px solid #8876de;
    background: #a5b4fc08;
    border-radius: 0 8px 8px 0;
    margin-bottom: 28px;
  }
  :global(.public-page .policy-note p:last-child) {
    margin-bottom: 0;
  }
  :global(.public-page .policy-date) {
    display: block;
    padding-top: 0;
    margin-top: 20px;
    font-size: 12px;
    color: #8f9dbb;
  }
  :global(.public-page .public-action) {
    display: inline-flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    min-height: 48px;
    padding: 13px 22px;
    border: 1px solid #a298ff70;
    border-radius: 7px;
    background: linear-gradient(135deg, #6253ec, #4938c9);
    color: #f3f0ff;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      filter 180ms ease;
  }
  :global(.public-page .public-action:hover) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px #6253ec40;
    filter: brightness(1.12);
  }
  :global(.public-page .public-action:active) {
    transform: translateY(0);
  }
  :global(.public-page .policy-summary) {
    --policy-accent: #818cf8;
    padding: 22px 26px;
    background: #6366f112;
    border-left: 5px solid var(--policy-accent);
    border-radius: 0 8px 8px 0;
    margin-bottom: 36px;
  }
  :global(.public-page .policy-summary h2) {
    margin: 0 0 12px;
    color: var(--policy-accent);
    font-size: 15px;
  }
  :global(.public-page .policy-summary p) {
    margin: 0;
    font-size: 14px;
  }
  @media (max-width: 900px) {
    .public-page.with-sidebar {
      grid-template-columns: minmax(0, 1fr);
    }
    .with-sidebar .page-introduction {
      grid-column: 1;
      grid-row: 1;
    }
    .page-sidebar {
      grid-column: 1;
      grid-row: 2;
      position: static;
      max-height: none;
      margin-bottom: 28px;
    }
    .with-sidebar .page-content {
      grid-column: 1;
      grid-row: 3;
    }
  }
  @media (max-width: 700px) {
    .public-page,
    .public-page.wide {
      width: calc(100% - 40px);
      padding: 44px 0 56px;
    }
    .page-introduction {
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    h1 {
      letter-spacing: -1.6px;
    }
    .page-introduction > p {
      font-size: 14px;
    }
    :global(.public-page h2) {
      font-size: 23px;
    }
  }
</style>
