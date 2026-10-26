<script lang="ts">
  import type {Snippet} from 'svelte';
  import {PRICING_TIERS, CRYPTO_DISCOUNT, PURCHASE_COVERAGE, PURCHASE_FEATURES, PURCHASE_FEES} from '$constant';
  import Icon from '$component/ui/Icon.svelte';

  let {
    plan = $bindable('monthly'),
    method = $bindable('card'),
    locked = false,
    renewal = false,
    payment,
    onchange,
    onmethodchange,
  }: {
    plan: keyof typeof PRICING_TIERS;
    method: 'card' | 'crypto';
    locked?: boolean;
    renewal?: boolean;
    payment: Snippet;
    onchange?: (plan: keyof typeof PRICING_TIERS) => void;
    onmethodchange?: () => void;
  } = $props();

  const tier = $derived(PRICING_TIERS[plan]);
  const cryptoPrice = $derived(tier.price * (1 - CRYPTO_DISCOUNT / 100));
  const cryptoSelected = $derived(method === 'crypto' || renewal);

  function chooseMethod(value: 'card' | 'crypto') {
    if (locked || method === value) {
      return;
    }

    method = value;
    onmethodchange?.();
  }

  function choose(value: keyof typeof PRICING_TIERS) {
    if (locked || renewal) {
      return;
    }

    plan = value;
    onchange?.(value);
  }
</script>

<div class="purchase-experience">
  <header class="purchase-intro">
    <span class="eyebrow">{renewal ? 'RENEW YOUR IDENTITY' : 'NEW IDENTITY'}</span>
    <h1>{renewal ? 'Keep your identity.' : 'An identity of your own.'}</h1>
    <p>{PURCHASE_COVERAGE}</p>
    <div class="feature-board" aria-label="Included features">
      <div class="feature-heading">Included with every plan</div>
      <div class="feature-grid">
        {#each PURCHASE_FEATURES as feature (feature.id)}
          <div class="feature-item" style:--service-color="var(--feature-{feature.id})">
            <span class="feature-symbol"><Icon name={feature.icon} size={19} /></span>
            <div><strong>{feature.label}</strong><span>{feature.detail}</span></div>
          </div>
        {/each}
      </div>
      <div class="feature-footer">
        <Icon name="code" size={14} /><span>Browser extension & API access included</span>
      </div>
    </div>
  </header>

  <section class="billing-section" aria-labelledby="billing-heading">
    <div class="section-heading">
      <h2 id="billing-heading">Choose your plan</h2>
      <span>One identity</span>
    </div>
    <div class="billing-options" role="group" aria-label="Billing period">
      {#each Object.entries(PRICING_TIERS) as [key, value] (key)}
        <button
          class:selected={plan === key}
          aria-pressed={plan === key}
          disabled={locked || renewal}
          onclick={() => choose(key as typeof plan)}>
          <span class="plan-name"
            ><span class="selection-dot"></span>{key === 'annually'
              ? 'Annual'
              : key === 'lifetime'
                ? 'Lifetime'
                : 'Monthly'}</span>
          <span class="plan-note"
            >{key === 'annually'
              ? '12 months of access'
              : key === 'lifetime'
                ? 'Pay once. No subscription.'
                : 'Billed monthly'}</span>
          <span class="plan-amount"
            >${(cryptoSelected ? value.price * (1 - CRYPTO_DISCOUNT / 100) : value.price).toFixed(2)}<small
              >{value.description}</small
            ></span>
        </button>
      {/each}
    </div>
    <button
      class="crypto-offer"
      class:applied={cryptoSelected}
      disabled={locked}
      onclick={() => chooseMethod('crypto')}
      aria-pressed={cryptoSelected}>
      <span class="discount-value">−{CRYPTO_DISCOUNT}%</span>
      <span class="discount-copy"
        ><strong>{cryptoSelected ? 'Crypto discount applied' : 'Pay less with crypto'}</strong><span
          ><s>${tier.price.toFixed(2)}</s><b>${cryptoPrice.toFixed(2)}</b> {tier.description}</span
        ></span>
      <Icon name={cryptoSelected ? 'check' : 'arrow'} size={17} />
    </button>
  </section>

  <section class="payment-section" aria-labelledby="payment-heading">
    <div class="section-heading"><h2 id="payment-heading">{renewal ? 'Renew with crypto' : 'Payment method'}</h2></div>
    {#if !renewal}
      <div class="method-options" role="group" aria-label="Payment method">
        <button aria-pressed={method === 'card'} disabled={locked} onclick={() => chooseMethod('card')}
          ><Icon name="card" size={17} />Card</button>
        <button aria-pressed={method === 'crypto'} disabled={locked} onclick={() => chooseMethod('crypto')}
          ><Icon name="wallet" size={17} />Crypto<span class="discount-tag">−{CRYPTO_DISCOUNT}%</span></button>
      </div>
    {/if}
    <div class="payment-content">{@render payment()}</div>
    <p class="fee-note"><Icon name="info" size={14} /><span>{PURCHASE_FEES}</span></p>
  </section>
</div>

<style>
  :global(.console-main:has(.purchase-experience)) {
    display: grid;
    align-items: center;
    max-width: none;
    min-height: 100dvh;
    padding: 28px clamp(28px, 3.2vw, 64px);
  }
  .purchase-experience {
    display: grid;
    grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.15fr);
    grid-template-rows: auto auto;
    align-content: center;
    align-items: start;
    column-gap: clamp(32px, 4vw, 76px);
    row-gap: 24px;
    width: 100%;
    margin: auto;
  }
  .purchase-intro {
    grid-column: 1;
    grid-row: 1 / 3;
    padding-right: clamp(20px, 3vw, 48px);
    border-right: 1px solid var(--line);
    min-width: 0;
  }
  .eyebrow {
    color: var(--accent-light);
    font:
      10px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.6px;
  }
  .purchase-experience h1 {
    font-size: clamp(30px, 2.8vw, 44px);
    font-weight: 550;
    line-height: 1.08;
    letter-spacing: -1.5px;
    margin: 17px 0 14px;
  }
  .purchase-intro > p {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
    margin: 0 0 22px;
    max-width: 440px;
  }
  .feature-heading {
    padding: 0 0 11px;
    font-size: 11px;
    border-bottom: 1px solid var(--line);
  }
  .feature-grid {
    display: grid;
    gap: 5px;
    margin: 8px 0;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 8px 10px;
    min-width: 0;
    border-radius: 5px;
    background: linear-gradient(110deg, color-mix(in srgb, var(--service-color) 7%, transparent), transparent);
  }
  .feature-symbol {
    display: grid;
    place-items: center;
    width: 33px;
    height: 33px;
    border-radius: 8px;
    flex-shrink: 0;
    border: 1px solid color-mix(in srgb, var(--service-color) 24%, transparent);
    background: color-mix(in srgb, var(--service-color) 9%, transparent);
  }
  .feature-symbol :global(svg) {
    color: var(--service-color);
  }
  .feature-item strong {
    display: block;
    font-size: 11px;
    font-weight: 550;
    margin-bottom: 4px;
  }
  .feature-item div > span {
    display: block;
    color: #8391ac;
    font-size: 10px;
    line-height: 1.4;
  }
  .feature-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 11px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 10px;
  }
  .billing-section,
  .payment-section {
    grid-column: 2;
    min-width: 0;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .purchase-experience h2 {
    font-size: 15px;
    font-weight: 550;
    margin: 0;
  }
  .section-heading > span {
    color: #8391ac;
    font-size: 10px;
  }
  .billing-options {
    display: grid;
    border-top: 1px solid var(--line);
  }
  .billing-options button {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 5px 12px;
    padding: 12px 14px;
    text-align: left;
    color: #a6b2cd;
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .billing-options button:hover:not(:disabled),
  .method-options button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent-hover) 9%, transparent);
  }
  .billing-options button:active:not(:disabled),
  .method-options button:active:not(:disabled) {
    background: color-mix(in srgb, var(--accent-deep) 18%, transparent);
  }
  .billing-options button.selected {
    color: #eef0ff;
    border-bottom-color: var(--accent-deep);
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--accent-deep) 22%, transparent),
      color-mix(in srgb, var(--accent-deep) 5%, transparent)
    );
  }
  .plan-name {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
  }
  .selection-dot {
    width: 11px;
    height: 11px;
    border: 1px solid #59647d;
    border-radius: 50%;
  }
  .selected .selection-dot {
    border: 4px solid var(--accent-deep);
    background: var(--accent-light);
  }
  .plan-note {
    padding-left: 21px;
    color: #8391ac;
    font-size: 10px;
  }
  .plan-amount {
    grid-column: 2;
    grid-row: 1 / 3;
    text-align: right;
    font-size: 23px;
    font-weight: 550;
    letter-spacing: -0.5px;
  }
  .plan-amount small {
    display: block;
    font-size: 10px;
    font-weight: 400;
    color: #8391ac;
    margin-top: 3px;
    letter-spacing: 0;
  }
  .crypto-offer {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 13px 16px;
    margin-top: 14px;
    text-align: left;
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-radius: 6px;
    background: linear-gradient(110deg, color-mix(in srgb, var(--accent-deep) 18%, transparent), #0d1426);
    color: var(--accent-light);
  }
  .crypto-offer:hover:not(:disabled) {
    border-color: var(--accent-hover);
    background: color-mix(in srgb, var(--accent-hover) 12%, #0d1426);
  }
  .crypto-offer.applied,
  .crypto-offer:active:not(:disabled) {
    border-color: var(--accent-deep);
    background: color-mix(in srgb, var(--accent-deep) 15%, #0d1426);
  }
  .discount-value {
    font-size: 26px;
    font-weight: 550;
    letter-spacing: -1px;
  }
  .discount-copy {
    flex: 1;
  }
  .discount-copy strong {
    display: block;
    font-size: 11px;
    font-weight: 550;
    color: #e3defa;
    margin-bottom: 5px;
  }
  .discount-copy > span {
    font-size: 10px;
    color: #94a0ba;
  }
  .discount-copy s {
    margin-right: 7px;
    color: #6f7d98;
  }
  .discount-copy b {
    color: #d7d0f3;
    font-size: 12px;
    font-weight: 550;
    margin-right: 4px;
  }
  .method-options {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .method-options button {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    gap: 9px;
    padding: 11px;
    border: 1px solid var(--line);
    border-radius: 5px;
    background: #0c1325;
    color: #a6b2cd;
    font-size: 12px;
  }
  .method-options button[aria-pressed='true'] {
    border-color: var(--accent-deep);
    color: var(--accent-light);
    background: color-mix(in srgb, var(--accent-deep) 15%, transparent);
  }
  .discount-tag {
    border-radius: 3px;
    padding: 3px 5px;
    color: var(--accent-light);
    background: color-mix(in srgb, var(--accent-deep) 20%, transparent);
    font:
      9px 'Fira Code Variable',
      monospace;
  }
  .payment-section :global(svg),
  .crypto-offer :global(svg) {
    color: currentColor;
  }
  .payment-content {
    overflow: visible;
    font-size: 12px;
    line-height: 1.7;
  }
  .payment-content :global(.card-start) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
  }
  .payment-content :global(.card-start p) {
    margin: 0;
    color: var(--muted);
    line-height: 1.8;
  }
  .payment-content :global(.card-start .control-button) {
    width: 100%;
  }
  .payment-content :global(.purchase-error) {
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--danger-color) 30%, transparent);
    background: var(--danger-surface);
    border-radius: 5px;
    color: #d4a4ae;
    font-size: 11px;
    line-height: 1.6;
    margin: 0 0 12px;
  }
  .payment-content :global(.field) {
    margin-bottom: 12px;
  }
  .payment-content :global(.field label) {
    margin-bottom: 7px;
  }
  .payment-content :global(form > .control-button) {
    width: 100%;
    margin-top: 5px;
  }
  .fee-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 12px 0 0;
    font-size: 10px;
    line-height: 1.7;
    color: #a5afc5;
  }
  .fee-note :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }
  @media (max-width: 1000px) {
    .purchase-experience {
      column-gap: 28px;
      grid-template-columns: minmax(240px, 0.85fr) minmax(0, 1.15fr);
    }
    .purchase-intro {
      padding-right: 20px;
    }
    .purchase-experience h1 {
      font-size: 32px;
    }
  }
  @media (max-width: 760px) {
    :global(.console-main:has(.purchase-experience)) {
      min-height: auto;
      padding: 26px 18px;
    }
    .purchase-experience {
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
    }
    .purchase-intro,
    .billing-section,
    .payment-section {
      grid-column: 1;
      grid-row: auto;
    }
    .purchase-intro {
      padding-right: 0;
      border-right: 0;
    }
    .purchase-experience h1 {
      font-size: 36px;
      max-width: 440px;
    }
    .feature-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .feature-item {
      padding: 10px 7px;
      gap: 8px;
    }
    .feature-item div > span {
      font-size: 9px;
    }
    .feature-item strong {
      font-size: 10px;
    }
    .payment-content {
      height: auto;
      overflow: visible;
      padding-right: 0;
    }
  }
</style>
