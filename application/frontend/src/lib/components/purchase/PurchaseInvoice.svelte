<script lang="ts">
  import QRCode from 'qrcode';
  import type {CryptoInvoice} from '$type';
  import {PURCHASE_INVOICE_MESSAGES} from '$constant';
  import Button from '$component/ui/Button.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import PurchaseModal from './PurchaseModal.svelte';

  let {
    open = $bindable(true),
    invoice,
    message,
    pending = false,
    onrefresh,
    ondismiss,
  }: {
    open?: boolean;
    invoice: CryptoInvoice;
    message: string;
    pending?: boolean;
    onrefresh: () => void;
    ondismiss?: () => void;
  } = $props();
  let qr = $state('');
  let qrError = $state(false);
  const paymentURI = $derived.by(() => {
    if (!invoice.depositAddress || invoice.depositMemo) {
      return '';
    }

    const coin = invoice.coin.toLowerCase();
    const scheme = {xmr: 'monero', btc: 'bitcoin', ltc: 'litecoin'}[coin];
    const amountKey = coin === 'xmr' ? 'tx_amount' : 'amount';

    return scheme
      ? `${scheme}:${invoice.depositAddress}?${amountKey}=${encodeURIComponent(invoice.depositAmount || '')}`
      : invoice.depositAddress;
  });

  $effect(() => {
    const uri = paymentURI;
    let active = true;

    qr = '';
    qrError = false;

    if (!uri) {
      return;
    }

    void QRCode.toDataURL(uri, {width: 240, margin: 2}).then(
      (value) => {
        if (active) {
          qr = value;
        }
      },
      () => {
        if (active) {
          qrError = true;
        }
      },
    );

    return () => {
      active = false;
    };
  });
  const statusLabel = $derived(
    invoice.status === 'pending'
      ? 'Awaiting payment'
      : invoice.status === 'confirming'
        ? 'Confirming payment'
        : invoice.status === 'underpaid'
          ? 'Partial payment received'
          : invoice.status === 'reconciling' || invoice.status === 'reconciliation'
            ? 'Payment needs review'
            : invoice.status === 'late'
              ? 'Payment received after expiry'
              : invoice.status === 'refunded'
                ? 'Payment refunded'
                : invoice.status === 'expired'
                  ? 'Invoice expired'
                  : 'Payment confirmed',
  );
</script>

<div class="invoice-overview">
  <p>{message || PURCHASE_INVOICE_MESSAGES[invoice.status]}</p>
  <div class="invoice-actions">
    <Button onclick={() => (open = true)}>View payment invoice</Button><Button
      variant="secondary"
      loading={pending}
      onclick={onrefresh}>Refresh payment status</Button>
  </div>
</div>

<PurchaseModal bind:open title="Crypto payment invoice" label="PAY WITH CRYPTO" wide {ondismiss}>
  <div class="invoice-status" role="status">
    <span class="status-dot"></span><strong>{statusLabel}</strong><span>{invoice.coin}</span>
  </div>
  <div class="invoice-payment">
    {#if paymentURI}<div class="invoice-qr" aria-busy={!qr && !qrError}>
        {#if qr}<img src={qr} alt="Invoice payment QR code" />
        {:else}<div class="qr-placeholder"><Icon name="wallet" size={24} /></div>{/if}
        <span>{qr ? 'Scan to pay' : qrError ? 'Copy address to pay' : 'Preparing QR code'}</span>
      </div>{/if}
    <div class="invoice-amount">
      <span>EXACT AMOUNT TO SEND</span>{#if invoice.depositAmount}<strong>{invoice.depositAmount}</strong>
        <div class="amount-unit">
          {invoice.coin}<span>${Number(invoice.usdAmount).toFixed(2)} identity access</span>
        </div>
        <Copy value={invoice.depositAmount} label="Copy amount" />{:else}<p>Payment details are being checked.</p>{/if}
    </div>
  </div>
  <dl class="invoice-data">
    {#if invoice.depositAddress}<div>
        <dt>Deposit address</dt>
        <dd><Copy value={invoice.depositAddress} label="Copy address" /></dd>
      </div>{/if}
    {#if invoice.depositMemo}<div class="memo-field">
        <dt>Required memo / destination tag</dt>
        <dd><Copy value={invoice.depositMemo} label="Copy required memo" /></dd>
      </div>{/if}
    <div>
      <dt>Invoice reference</dt>
      <dd><Copy value={invoice.invoiceID} label="Copy reference" /></dd>
    </div>
  </dl>
  <div class="invoice-expiry">
    <Icon name="info" size={14} /><span
      >Expires {new Date(invoice.expiresAt).toLocaleString('en-GB', {timeZone: 'UTC'})} UTC</span>
  </div>
  <p class="invoice-message">{message}</p>
  <p class="invoice-footnote">Keep the invoice reference. An interrupted connection does not cancel a payment.</p>
  {#if invoice.depositMemo}<p class="memo-note">
      Copy the address and memo separately. A QR code is not provided for payments requiring a memo or destination tag.
    </p>{/if}
  <div class="invoice-actions">
    <Button loading={pending} onclick={onrefresh}>Refresh payment status</Button>{#if invoice.externalLink}<a
        class="control-button secondary"
        href={invoice.externalLink}
        target="_blank"
        rel="noopener noreferrer">Track swap</a
      >{/if}
  </div>
</PurchaseModal>

<style>
  .invoice-overview > p {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.8;
  }
  .invoice-status {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 14px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--link-color) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--link-color) 18%, transparent);
    color: #c2b5ed;
  }
  .invoice-status strong {
    font-size: 12px;
    font-weight: 500;
  }
  .invoice-status > span:last-child {
    margin-left: auto;
    font:
      10px 'Fira Code Variable',
      monospace;
    color: var(--link-color);
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--link-color);
    box-shadow: 0 0 8px color-mix(in srgb, var(--link-color) 24%, transparent);
  }
  .invoice-payment {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px 0;
  }
  .invoice-qr {
    flex-shrink: 0;
    text-align: center;
  }
  .qr-placeholder {
    display: grid;
    place-content: center;
    gap: 10px;
    width: 124px;
    height: 124px;
    color: var(--muted);
    font-size: 10px;
  }
  .qr-placeholder :global(svg) {
    margin: auto;
  }
  .invoice-qr img {
    display: block;
    width: 124px;
    height: 124px;
    border-radius: 4px;
  }
  .invoice-qr > span {
    display: block;
    color: #9789bc;
    font-size: 9px;
    margin-top: 9px;
  }
  .invoice-amount {
    min-width: 0;
    flex: 1;
  }
  .invoice-amount > span {
    display: block;
    color: var(--link-color);
    font:
      9px 'Fira Code Variable',
      monospace;
    letter-spacing: 1.2px;
    margin-bottom: 12px;
  }
  .invoice-amount > strong {
    display: block;
    color: #e3dafa;
    font:
      500 clamp(18px, 3vw, 28px) 'Fira Code Variable',
      monospace;
    letter-spacing: -1px;
    overflow-wrap: anywhere;
  }
  .amount-unit {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    font-size: 13px;
    color: var(--link-color);
    margin: 9px 0 14px;
  }
  .amount-unit span {
    font-size: 10px;
    color: #9a8fba;
    align-self: center;
  }
  .invoice-amount :global(.copy-value code) {
    display: none;
  }
  .invoice-amount :global(.copy-value) {
    justify-content: flex-start;
  }
  .invoice-amount :global(.copy-actions .control-button) {
    background: color-mix(in srgb, var(--link-color) 7%, transparent);
    border: 1px solid color-mix(in srgb, var(--link-color) 18%, transparent);
    color: var(--link-color);
    min-height: 30px;
    font-size: 10px;
    transform: translateY(0) scale(1);
    transition:
      color 240ms ease,
      background-color 180ms ease,
      border-color 220ms ease,
      box-shadow 220ms ease,
      transform 180ms ease;
  }
  .invoice-amount :global(.copy-actions .control-button:hover:not(:disabled)) {
    color: var(--link-color-hover);
    background: color-mix(in srgb, var(--link-color-hover) 14%, transparent);
    border-color: color-mix(in srgb, var(--link-color-hover) 38%, transparent);
    box-shadow: 0 3px 10px color-mix(in srgb, var(--link-color-hover) 10%, transparent);
    transform: translateY(-1px) scale(1);
  }
  .invoice-amount :global(.copy-actions .control-button:active:not(:disabled)) {
    color: var(--link-color-pressed);
    background: color-mix(in srgb, var(--link-color-pressed) 22%, transparent);
    border-color: color-mix(in srgb, var(--link-color-pressed) 48%, transparent);
    box-shadow: none;
    transform: translateY(0) scale(0.98);
  }
  .invoice-data {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    margin: 0;
  }
  .invoice-data > div {
    min-width: 0;
    padding: 13px 14px;
    border-radius: 6px;
    background: #0c122388;
    border: 1px solid #8170ee1a;
  }
  .invoice-data dt {
    color: #a99bcf;
    font-size: 10px;
    margin-bottom: 8px;
  }
  .invoice-data dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .invoice-data :global(.copy-value code) {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    overflow-wrap: normal;
    text-overflow: ellipsis;
    color: #cbc0e8;
    font-size: 11px;
    line-height: 1.8;
  }
  .invoice-data :global(.copy-actions .control-button) {
    color: var(--link-color);
    font-size: 10px;
    padding-inline: 6px;
  }
  .invoice-data .memo-field {
    border-color: #8170ee40;
  }
  .invoice-expiry {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8f83ad;
    font-size: 10px;
    margin-top: 16px;
  }
  .invoice-message,
  .memo-note {
    font-size: 11px;
    color: #b9acd7;
    line-height: 1.8;
    margin: 14px 0 0;
  }
  .invoice-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }
  .invoice-footnote {
    color: #7f739c;
    font-size: 10px;
    line-height: 1.7;
    margin: 5px 0 0;
  }
  @media (max-width: 500px) {
    .invoice-payment {
      gap: 16px;
    }
    .qr-placeholder {
      display: grid;
      place-content: center;
      gap: 10px;
      width: 124px;
      height: 124px;
      color: var(--muted);
      font-size: 10px;
    }
    .qr-placeholder :global(svg) {
      margin: auto;
    }
    .invoice-qr img {
      width: 88px;
      height: 88px;
    }
    .invoice-amount > strong {
      font-size: 18px;
    }
    .invoice-data :global(.copy-value code) {
      font-size: 10px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .invoice-amount :global(.copy-actions .control-button) {
      transition: none;
    }
    .invoice-amount :global(.copy-actions .control-button:is(:hover, :active)) {
      transform: none;
    }
  }
</style>
