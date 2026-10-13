<script lang="ts">
  import type {Snippet} from 'svelte';

  let {
    eyebrow = '',
    title,
    description = '',
    children,
    wide = false,
  }: {eyebrow?: string; title: string; description?: string; children: Snippet; wide?: boolean} = $props();
</script>

<div class="public-page" class:wide>
  <div class="page-introduction">
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
  .page-introduction {
    padding-bottom: 28px;
    margin-bottom: 28px;
    border-bottom: 1px solid #a5b4fc25;
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
    padding-top: 28px;
    margin-top: 40px;
    border-top: 1px solid #a5b4fc20;
    font-size: 12px;
    color: #8f9dbb;
  }
  :global(.public-page .public-action) {
    display: inline-flex;
    gap: 20px;
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
  }
  @media (max-width: 700px) {
    .public-page,
    .public-page.wide {
      width: calc(100% - 40px);
      padding: 44px 0 56px;
    }
    .page-introduction {
      padding-bottom: 30px;
      margin-bottom: 30px;
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
