<script lang="ts">
  import {decrypt} from '$utils/cryptography';
  import {reserveWalletAddress} from '$utils/wallet';
  import {vaultKey} from '$store';
  import {get} from 'svelte/store';
  import {onDestroy} from 'svelte';
  import {generatePDF, invoiceAmount} from '$utils/pdf-invoice';
  import type {FullIdentity, Coins, WalletState} from '$type';
  import QRCode from 'qrcode';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';

  let {account, coin, crypto}: {account: FullIdentity; coin: Coins; crypto: WalletState} = $props();
  let client = $state('');
  let email = $state('');
  let invoice = $state('');
  let due = $state('');
  let rows = $state([{description: '', quantity: 1, price: 0}]);
  let pending = $state(false);
  let error = $state('');
  let active = true;
  const addressRequests: Record<string, string> = {};

  onDestroy(() => (active = false));

  const totalCents = $derived(rows.reduce((sum, row) => sum + row.quantity * Math.round(row.price * 100), 0));
  const total = $derived(totalCents / 100);

  async function download(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';

    try {
      const key = get(vaultKey);
      const rate = crypto.prices[coin]?.usdPrice;

      if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
        throw new Error('A current exchange rate is required. Refresh wallet prices.');
      }

      if (
        rows.some(
          (row) =>
            !Number.isSafeInteger(row.quantity) || row.quantity < 1 || !Number.isFinite(row.price) || row.price < 0,
        )
      ) {
        throw new Error('Use positive whole quantities and nonnegative item prices.');
      }

      const scope = `${account.id}:${coin}:${invoice}`;

      addressRequests[scope] ||= globalThis.crypto.randomUUID();

      const cryptoDue = invoiceAmount(coin, totalCents, rate);

      const address =
        coin === 'btc' || coin === 'ltc'
          ? (await reserveWalletAddress(account, coin, 0, addressRequests[scope])).address
          : coin === 'xmr'
            ? await decrypt(account.walletKeys.xmr.address, key!)
            : account.walletKeys.evm;

      const qrImage = await QRCode.toDataURL(address, {width: 240, margin: 2});

      if (!active || (coin === 'xmr' && get(vaultKey) !== key)) {
        return;
      }

      generatePDF(
        {
          name: account.name,
          email: account.email,
          invoice: invoice || globalThis.crypto.randomUUID(),
          date: new Date().toLocaleDateString(),
          dateDue: due,
        },
        {clientName: client, clientEmail: email},
        {
          tableRows: rows.map((row) => ({...row, total: (Math.round(row.price * 100) * row.quantity) / 100})),
          totalTransactionPrice: total,
        },
        {cryptoChoice: coin, exchangeRate: rate, cryptoDue, destAddr: address, qrImage},
      );
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not generate this invoice.';
    } finally {
      pending = false;
    }
  }
</script>

<section class="panel">
  <h3>Create a payment invoice</h3>
  <p>Download a PDF with your receive address and the current {coin.toUpperCase()} exchange rate.</p>
  <Status message={error} kind="error" />
  <form onsubmit={download} class="invoice-form">
    <div class="form-grid">
      <div class="field">
        <label for="invoice-client">Client name</label><input id="invoice-client" bind:value={client} required />
      </div>
      <div class="field">
        <label for="invoice-email">Client email</label><input id="invoice-email" type="email" bind:value={email} />
      </div>
      <div class="field">
        <label for="invoice-reference">Invoice reference</label><input
          id="invoice-reference"
          bind:value={invoice}
          required />
      </div>
      <div class="field">
        <label for="invoice-due">Due date</label><input id="invoice-due" type="date" bind:value={due} required />
      </div>
    </div>
    <div class="invoice-rows">
      {#each rows as row, index (index)}<div>
          <input aria-label="Item description" bind:value={row.description} placeholder="Description" required /><input
            aria-label="Quantity"
            type="number"
            min="1"
            step="1"
            bind:value={row.quantity}
            required /><input
            aria-label="Price in USD"
            type="number"
            min="0"
            step="0.01"
            bind:value={row.price}
            required /><Button
            type="button"
            variant="quiet"
            icon="trash"
            aria-label="Remove item"
            disabled={rows.length === 1}
            onclick={() => (rows = rows.filter((_, i) => i !== index))} />
        </div>{/each}
    </div>
    <div class="button-row invoice-actions">
      <Button
        type="button"
        variant="secondary"
        icon="plus"
        onclick={() => (rows = [...rows, {description: '', quantity: 1, price: 0}])}>Add item</Button
      ><span>Total · ${total.toFixed(2)}</span>
    </div>
    <Button type="submit" loading={pending} disabled={coin === 'xmr' && !$vaultKey} icon="download"
      >Download PDF invoice</Button>
  </form>
</section>

<style>
  .invoice-form {
    margin-top: 24px;
  }
  .invoice-rows {
    display: grid;
    gap: 10px;
  }
  .invoice-rows > div {
    display: grid;
    grid-template-columns: 1fr 65px 100px 35px;
    gap: 8px;
  }
  .invoice-actions {
    justify-content: space-between;
    margin: 20px 0;
    font-size: 13px;
  }
  @media (max-width: 550px) {
    .invoice-rows > div {
      grid-template-columns: 1fr 70px 80px;
    }
    .invoice-rows > div > input:first-child {
      grid-column: 1/-1;
    }
  }
</style>
