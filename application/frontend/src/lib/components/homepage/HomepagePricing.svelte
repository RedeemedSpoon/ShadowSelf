<script lang="ts">
  import {fly} from 'svelte/transition';
  import {onMount} from 'svelte';
  import {PRICING_TIERS, PURCHASE_COVERAGE, CRYPTO_DISCOUNT, PURCHASE_FEES} from '$constant';
  import Icon from '$component/ui/Icon.svelte';

  let reducedMotion = $state(true);

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotion = preference.matches;
    };

    update();
    preference.addEventListener('change', update);

    return () => preference.removeEventListener('change', update);
  });

  let billing = $state<keyof typeof PRICING_TIERS>('monthly');
  let plan = $derived(PRICING_TIERS[billing]);
</script>

<section class="pricing-chapter" id="pricing">
  <div class="chapter-width pricing-layout" data-reveal>
    <div class="pricing-copy">
      <h2>One identity.<br />Your choice of plan.</h2>
      <p>{PURCHASE_COVERAGE} Choose monthly, annual, or lifetime access.</p>
      <a class="inline-link" href="/purchase">Full plan and payment details</a>
    </div>
    <div class="price-panel">
      <div class="billing-options" aria-label="Billing period">
        {#each Object.entries(PRICING_TIERS) as [key, value] (key)}<button
            aria-pressed={billing === key}
            onclick={() => (billing = key as keyof typeof PRICING_TIERS)}
            >{value.title.split(' ')[0] === 'Annual' ? 'Yearly' : value.title.split(' ')[0]}</button
          >{/each}
      </div>
      <div class="price-value" aria-live="polite" aria-atomic="true">
        {#key billing}<div in:fly={{y: reducedMotion ? 0 : 10, duration: reducedMotion ? 0 : 280}}>
            <div class="price"><span>${plan.price}</span><small>{plan.description}</small></div>
            <p class="plan-caption">{plan.title}</p>
          </div>{/key}
      </div>
      <div class="crypto-pricing">
        <strong>{CRYPTO_DISCOUNT}% less with crypto</strong><span
          >${(plan.price * (1 - CRYPTO_DISCOUNT / 100)).toFixed(2)} {plan.description}</span>
      </div>
      <ul>
        <li><Icon name="check" size={15} /><span>Editable profiles, encrypted passwords, and TOTP</span></li>
        <li><Icon name="check" size={15} /><span>Dedicated email inbox, aliases, PGP, and SMS</span></li>
        <li><Icon name="check" size={15} /><span>Cryptocurrency wallets and virtual cards</span></li>
        <li><Icon name="check" size={15} /><span>Residential proxies managed per identity</span></li>
        <li><Icon name="check" size={15} /><span>Online drive, image metadata tools, and cloaking</span></li>
        <li><Icon name="check" size={15} /><span>Website, browser extension, and API access</span></li>
      </ul>
      <a class="primary-action" href="/purchase">Choose a plan</a>
      <p class="pricing-fees">{PURCHASE_FEES}</p>
    </div>
  </div>
</section>

<style>
  .pricing-chapter {
    background: radial-gradient(ellipse at 80% 50%, #4f46e516, transparent 60%), #090d1c;
    border-block: 1px solid #9da8db14;
    padding-block: 115px;
  }
  .pricing-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 100px;
    align-items: center;
  }
  .pricing-copy h2 {
    font-size: clamp(32px, 3.6vw, 48px);
    letter-spacing: -2px;
    margin-bottom: 28px;
  }
  .pricing-copy p {
    max-width: 470px;
    margin-bottom: 20px;
  }
  .price-panel {
    border: 1px solid #777ac64f;
    border-radius: 18px;
    padding: 30px;
    background: linear-gradient(135deg, #1b2140, #101629);
    box-shadow: 0 30px 70px #0004;
  }
  .billing-options {
    display: flex;
    gap: 5px;
    padding: 5px;
    border: 1px solid #c3bdff20;
    border-radius: 9px;
    background: #080e2080;
  }
  .billing-options button {
    flex: 1;
    font-size: 13px;
    color: #a9b1ce;
    background: none;
    border: 0;
    box-shadow: none;
    padding: 12px 8px;
    border-radius: 6px;
  }
  .billing-options button[aria-pressed='true'] {
    color: #f3f0ff;
    background: var(--accent-deep);
  }
  .price-value {
    display: flow-root;
    min-height: 130px;
  }
  .price {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 14px;
    margin: 33px 0 8px;
  }
  .price > span {
    font-size: 65px;
    letter-spacing: -3px;
    color: #ecebff;
    font-weight: 550;
    line-height: 1;
  }
  .price small {
    font-size: 13px;
    color: #a6aecb;
  }
  .plan-caption {
    font-size: 13px;
    color: var(--accent-light);
  }
  ul {
    margin: 28px 0;
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 12px;
    line-height: 1.7;
    padding: 9px 0;
    color: #c2c8df;
  }
  li :global(svg) {
    flex-shrink: 0;
    margin-top: 3px;
    color: var(--accent);
  }
  .crypto-pricing {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 14px;
    margin-top: 16px;
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--accent-deep) 12%, transparent);
    color: var(--accent-light);
    font-size: 11px;
  }
  .crypto-pricing strong {
    font-weight: 550;
  }
  .price-panel .pricing-fees {
    margin: 16px 0 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.8;
  }
  .price-panel .primary-action {
    display: flex;
    width: 100%;
  }
  @media (max-width: 800px) {
    .pricing-layout {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .pricing-copy h2 {
      font-size: clamp(25px, 6.3vw, 38px);
      letter-spacing: -1px;
    }
    .pricing-copy p {
      max-width: 100%;
    }
    .price-panel {
      max-width: 520px;
      width: 100%;
      margin-inline: auto;
    }
    .pricing-chapter {
      padding-block: 70px;
    }
  }
  @media (max-width: 420px) {
    .price-panel {
      padding: 22px;
    }
    .price > span {
      font-size: 55px;
    }
  }
</style>
