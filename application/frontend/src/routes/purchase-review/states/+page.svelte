<script lang="ts">
  import {PURCHASE_REVIEW_CASES} from '$lib/constants/purchase-review';
  import {PAYMENT_ASSET_OPTIONS, PRICING_TIERS} from '$constant';
  import type {Coins} from '$type';
  import Select from '$component/ui/Select.svelte';

  let plan = $state<keyof typeof PRICING_TIERS>('monthly');
  let coin = $state<Coins>('xmr');
  const groups = [...new Set(PURCHASE_REVIEW_CASES.map((item) => item.group))];
  const plans = Object.entries(PRICING_TIERS).map(([value, tier]) => ({value, label: tier.title}));
</script>

<svelte:head><title>Purchase states | ShadowSelf</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

<div class="state-index">
  <header>
    <span class="eyebrow">PURCHASE WORKSPACE</span>
    <h1>Every purchase state.</h1>
    <p>
      Open a state directly, then use its controls to try the flow. These screens use synthetic payment data and never
      call billing providers.
    </p>
  </header>
  <div class="state-filters">
    <div class="field">
      <label for="state-plan">Plan</label><Select id="state-plan" label="Plan" options={plans} bind:value={plan} />
    </div>
    <div class="field">
      <label for="state-coin">Crypto asset and network</label><Select
        id="state-coin"
        label="Crypto asset and network"
        options={PAYMENT_ASSET_OPTIONS}
        bind:value={coin} />
    </div>
  </div>
  <details class="card-values">
    <summary>Card values for testing interactive outcomes</summary>
    <p>
      These values control this local preview only. Use any three-digit security code and an expiry in MM / YY format.
    </p>
    <dl>
      <div>
        <dt>4242 4242 4242 4242</dt>
        <dd>Payment succeeds</dd>
      </div>
      <div>
        <dt>4000 0000 0000 0002</dt>
        <dd>Payment is declined</dd>
      </div>
      <div>
        <dt>4000 0025 0000 3155</dt>
        <dd>Bank authentication is required</dd>
      </div>
      <div>
        <dt>4000 0000 0000 0119</dt>
        <dd>Connection is interrupted</dd>
      </div>
    </dl>
  </details>
  <div class="state-groups">
    {#each groups as group (group)}
      <section>
        <h2>{group}</h2>
        <ul>
          {#each PURCHASE_REVIEW_CASES.filter((item) => item.group === group) as item (item.id)}
            <li>
              <a
                href="/purchase-review?case={item.id}&plan={plan}&coin={coin}"
                target="_blank"
                rel="noopener noreferrer">{item.label}<span aria-hidden="true">↗</span></a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
  <p class="state-note">
    Loading and processing links stay in that state for inspection. Invoice refresh advances pending to confirming to
    paid. Expired, underpaid, late, refunded, and reconciliation states stay pinned. Use the card form to check required
    fields and invalid input.
  </p>
</div>

<style>
  .state-index {
    max-width: 1200px;
    margin: auto;
  }
  .eyebrow {
    color: var(--accent-light);
    font:
      10px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.5px;
  }
  .state-index h1 {
    font-size: 38px;
    margin: 18px 0;
    letter-spacing: -1px;
  }
  header p,
  .state-note {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.8;
    max-width: 750px;
  }
  .state-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-width: 650px;
    gap: 20px;
    margin: 28px 0;
  }
  .card-values {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 28px;
    color: var(--muted);
    font-size: 11px;
  }
  .card-values summary {
    color: var(--accent-light);
    cursor: pointer;
  }
  .card-values p {
    line-height: 1.8;
  }
  .card-values dl {
    display: grid;
    gap: 12px;
  }
  .card-values dl > div {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
  }
  .card-values dt {
    font-family: 'Fira Code Variable', monospace;
  }
  .card-values dd {
    margin: 0;
  }
  .state-groups {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px;
  }
  section h2 {
    font-size: 15px;
    margin-bottom: 14px;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    border-bottom: 1px solid var(--line);
  }
  a {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 0;
    font-size: 12px;
  }
  .state-note {
    border-top: 1px solid var(--line);
    padding-top: 20px;
    margin-top: 30px;
  }
  @media (max-width: 900px) {
    .state-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .state-groups,
    .state-filters {
      grid-template-columns: 1fr;
    }
  }
</style>
