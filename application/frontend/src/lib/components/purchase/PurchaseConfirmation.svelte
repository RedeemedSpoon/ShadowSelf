<script lang="ts">
  import type {Snippet} from 'svelte';
  import {PRICING_TIERS, CRYPTO_DISCOUNT, PURCHASE_FEES} from '$constant';
  import Icon from '$component/ui/Icon.svelte';

  let {plan, method, children}: {plan: keyof typeof PRICING_TIERS; method: 'card' | 'crypto'; children?: Snippet} =
    $props();
  const tier = $derived(PRICING_TIERS[plan]);
  const total = $derived(method === 'crypto' ? tier.price * (1 - CRYPTO_DISCOUNT / 100) : tier.price);
</script>

<div class="confirmation-summary">
  <div class="confirmation-meta"><span>ONE IDENTITY</span><strong>{tier.title}</strong></div>
  <div class="confirmation-total"><strong>${total.toFixed(2)}</strong><span>{tier.description}</span></div>
  {#if method === 'crypto'}<div class="saving">
      <span>−{CRYPTO_DISCOUNT}%</span>
      <p>Crypto discount applied<br /><strong>You save ${(tier.price - total).toFixed(2)}</strong></p>
    </div>{/if}
  <p class="renewal-terms">
    {plan === 'lifetime'
      ? 'One payment. No subscription.'
      : method === 'crypto'
        ? 'Renew manually with crypto.'
        : 'Renews automatically. Cancel in settings.'}
  </p>
  <p class="fee-terms"><Icon name="info" size={14} /><span>{PURCHASE_FEES}</span></p>
</div>
{#if children}<div class="confirmation-actions">{@render children()}</div>{/if}

<style>
  .confirmation-summary {
    padding: 22px;
    border: 1px solid color-mix(in srgb, var(--accent) 23%, transparent);
    border-radius: 10px;
    background: linear-gradient(125deg, #4938c91c, #0d142600);
  }
  .confirmation-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }
  .confirmation-meta > span {
    color: var(--accent-light);
    font:
      9px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.5px;
  }
  .confirmation-meta strong {
    color: #c4b9e7;
    font-size: 12px;
    font-weight: 500;
  }
  .confirmation-total {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 22px 0 17px;
  }
  .confirmation-total > strong {
    font-size: 48px;
    font-weight: 550;
    letter-spacing: -2px;
    line-height: 1;
    color: #ebe5ff;
  }
  .confirmation-total > span {
    color: #9e91c5;
    font-size: 12px;
  }
  .saving {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
    color: var(--accent-light);
  }
  .saving > span {
    padding: 8px;
    border-radius: 5px;
    background: #6253ec1c;
    font:
      14px 'Fira Code Variable',
      monospace;
  }
  .saving p {
    margin: 0;
    font-size: 11px;
    line-height: 1.8;
    color: #a79acb;
  }
  .saving p strong {
    color: #d5c9fb;
    font-weight: 500;
  }
  .renewal-terms {
    margin: 0;
    font-size: 12px;
    line-height: 1.7;
    color: #b6a9d8;
  }
  .fee-terms {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: #8f83ae;
    font-size: 10px;
    line-height: 1.8;
    margin: 10px 0 0;
  }
  .fee-terms :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .confirmation-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }
  @media (max-width: 450px) {
    .confirmation-summary {
      padding: 18px;
    }
    .confirmation-meta {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }
    .confirmation-total > strong {
      font-size: 42px;
    }
  }
</style>
