<script lang="ts">
  import type {PageData} from './$types';
  import {PRICING_TIERS, MAIL_DOMAIN} from '$constant';
  import Icon from '$component/ui/Icon.svelte';

  let {data}: {data: PageData} = $props();
  const receipt = $derived(data.receipt);
  const details = $derived(receipt.details);
  const amount = (value: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: details.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(Number(value));
  const date = (value: string) => new Date(value).toLocaleString('en-GB', {timeZone: 'UTC'}) + ' UTC';
  const providerLink = (value?: string) => {
    if (!value) {
      return '';
    }

    try {
      const link = new URL(value);

      return link.protocol === 'https:' && !link.username && !link.password && link.hostname.endsWith('.stripe.com')
        ? link.href
        : '';
    } catch {
      return '';
    }
  };
</script>

<svelte:head><title>Payment receipt | ShadowSelf</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

<article class="receipt">
  <header>
    <div>
      <span class="receipt-brand">ShadowSelf</span><span class="eyebrow">BILLING RECEIPT</span>
      <h1>{details.renewal ? 'Identity renewal' : 'Identity purchase'}</h1>
    </div>
    <span class="paid"><Icon name="check" size={16} />Paid</span>
  </header>
  <p class="reference">{receipt.id}</p>
  <div class="total">
    <span>Amount paid</span><strong>{amount(details.amount)}</strong><span>{date(details.paidAt)}</span>
  </div>
  <dl>
    <div>
      <dt>Identity</dt>
      <dd>{details.identityID}</dd>
    </div>
    <div>
      <dt>Plan</dt>
      <dd>{PRICING_TIERS[details.plan].title}</dd>
    </div>
    <div>
      <dt>Payment method</dt>
      <dd>{details.paymentMethod}</dd>
    </div>
    <div>
      <dt>Discount included</dt>
      <dd>{amount(details.discount)}</dd>
    </div>
    <div>
      <dt>Tax</dt>
      <dd>{details.tax === null ? 'Not separately reported' : amount(details.tax)}</dd>
    </div>
    {#if details.periodStart}<div>
        <dt>Access starts</dt>
        <dd>{date(details.periodStart)}</dd>
      </div>{/if}
    <div>
      <dt>Access ends</dt>
      <dd>
        {details.periodEnd
          ? date(details.periodEnd)
          : details.plan === 'lifetime'
            ? 'Lifetime access'
            : 'See subscription billing details'}
      </dd>
    </div>
    {#if details.cryptoAmount}<div>
        <dt>Applied to identity access</dt>
        <dd>{details.cryptoAmount} {details.cryptoCoin}</dd>
      </div>{/if}
    <div>
      <dt>Payment reference</dt>
      <dd><code>{receipt.providerReference}</code></dd>
    </div>
    {#if details.providerInvoiceNumber}<div>
        <dt>Provider invoice</dt>
        <dd>{details.providerInvoiceNumber}</dd>
      </div>{/if}
  </dl>
  <p class="notice">This receipt covers identity access. Network fees and separately billed usage are not included.</p>
  <p class="support">Questions about this payment? <a href="mailto:contact@{MAIL_DOMAIN}">contact@{MAIL_DOMAIN}</a></p>
  <div class="actions">
    <a
      class="control-button primary"
      href="/api/billing/receipts/{receipt.id}/pdf?access={encodeURIComponent(data.access)}"
      download><Icon name="download" size={15} />Download PDF</a>
    {#if providerLink(details.providerInvoicePDF)}<a
        class="control-button quiet"
        href={providerLink(details.providerInvoicePDF)}
        target="_blank"
        rel="noopener noreferrer">Stripe invoice PDF</a
      >{:else if providerLink(details.providerInvoiceURL)}<a
        class="control-button quiet"
        href={providerLink(details.providerInvoiceURL)}
        target="_blank"
        rel="noopener noreferrer">Stripe invoice</a
      >{/if}
  </div>
</article>

<style>
  .receipt {
    width: min(780px, 100%);
    margin: 25px auto;
    padding: 32px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .receipt-brand {
    display: block;
    color: #e6ebff;
    font-size: 19px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  .eyebrow {
    color: var(--accent);
    font:
      10px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.6px;
  }
  h1 {
    font-size: 27px;
    letter-spacing: -0.7px;
    margin: 10px 0 0;
  }
  .paid {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: var(--accent);
  }
  .reference {
    color: var(--muted);
    font:
      11px 'Fira Code Variable',
      monospace;
    overflow-wrap: anywhere;
    margin: 20px 0 0;
  }
  .total {
    display: grid;
    gap: 9px;
    padding: 28px 0;
    border-bottom: 1px solid var(--line);
  }
  .total span {
    color: var(--muted);
    font-size: 12px;
  }
  .total strong {
    font-size: 42px;
    font-weight: 550;
    letter-spacing: -1.5px;
  }
  dl {
    margin: 22px 0;
  }
  dl div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
    gap: 20px;
    padding: 10px 0;
    font-size: 12px;
    line-height: 1.7;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  code {
    font-size: 11px;
  }
  .notice {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.8;
    margin: 24px 0;
  }
  .support {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.8;
    margin: 0 0 24px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  @media (max-width: 600px) {
    .receipt {
      padding: 22px;
      margin: 0 auto;
    }
    h1 {
      font-size: 23px;
    }
    dl div {
      grid-template-columns: minmax(0, 1fr);
      gap: 4px;
    }
  }
</style>
