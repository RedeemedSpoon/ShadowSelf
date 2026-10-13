import {repairIdentityDeletions, repairAccountDeletions} from '@core/identity-service';
import {repairStripeEvents} from '@core/stripe-service';
import {repairPaymentInvoices, repairWalletSwapRequests} from '@core/swap-provider';
import {withBillingWallet, saveWalletState, parseXmr, invoiceState} from '@core/wallet-service';
import {POLL_FEES_INTERVAL, POLL_PRICES_INTERVAL, POLL_INVOICES_INTERVAL, POLL_CLEANUP_INTERVAL} from '@core/constants';
import {cryptoFees, cryptoPrices, invoiceConnections, watchWallet, billingReadiness} from '@core/states';
import {BTC_API, ETH_API, LTC_API, XMR_NODE, COINGECKO_URL} from '@core/constants';
import {PAYMENT_WINDOW_MIN, INVOICE_POLL_BATCH_SIZE, INVOICE_ACTIVE_MONITOR_MS} from '@core/constants';
import type {QueryInvoice} from '@type';
import {generateIdentityID} from '@utils/cryptography';
import {providerJson, withReservedTransaction, reportFailure} from '@utils/utils';
import {sql} from '@core/services';
import {cryptoBillingEnabled, stripeConfig, moneroWallet, trocadorApiKey} from '@core/config';
import type {ReservedSql} from 'postgres';

let activeInvoiceCursor: string | null = null;
let archivedInvoiceCursor: string | null = null;

export async function processInvoiceBatch<T>(invoices: T[], process: (invoice: T) => Promise<void>) {
  let failed = 0;

  for (const invoice of invoices) {
    try {
      await process(invoice);
    } catch {
      failed += 1;
      console.error('Invoice processing failed; financial records retained for the next pass');
    }
  }

  return {processed: invoices.length, failed};
}

export async function pollInvoices(connection: ReservedSql, wallet = watchWallet) {
  if (!wallet) {
    return;
  }

  const started = Date.now();
  const height = await wallet.getHeight();
  await wallet.sync();
  billingReadiness.lastSync = Date.now();

  const cutoff = new Date(Date.now() - INVOICE_ACTIVE_MONITOR_MS);
  const archiveLimit = Math.max(1, Math.floor(INVOICE_POLL_BATCH_SIZE / 4));
  const active = await connection`SELECT * FROM crypto_invoices
    WHERE status IN ('pending', 'confirming', 'underpaid', 'expired', 'late') AND xmr_subaddress IS NOT NULL
    AND creation_date >= ${cutoff} AND id > COALESCE(${activeInvoiceCursor}::uuid, '00000000-0000-0000-0000-000000000000'::uuid) ORDER BY id LIMIT ${INVOICE_POLL_BATCH_SIZE - archiveLimit}`;
  const archived = await connection`SELECT * FROM crypto_invoices
    WHERE status IN ('pending', 'confirming', 'underpaid', 'expired', 'late') AND xmr_subaddress IS NOT NULL
    AND creation_date < ${cutoff} AND id > COALESCE(${archivedInvoiceCursor}::uuid, '00000000-0000-0000-0000-000000000000'::uuid) ORDER BY id LIMIT ${archiveLimit}`;

  activeInvoiceCursor = active.length === INVOICE_POLL_BATCH_SIZE - archiveLimit ? active.at(-1)!.id : null;
  archivedInvoiceCursor = archived.length === archiveLimit ? archived.at(-1)!.id : null;

  const result = await processInvoiceBatch([...active, ...archived] as QueryInvoice[], (invoice) => observeInvoice(connection, invoice, wallet));

  if ((await wallet.getHeight()) !== height) {
    await saveWalletState(connection, wallet);
  }

  if (result.failed || Date.now() - started >= POLL_INVOICES_INTERVAL) {
    console.info('Invoice polling metrics', {...result, durationMs: Date.now() - started, archived: archived.length});
  }

  return {...result, durationMs: Date.now() - started, archived: archived.length};
}

export async function activateInvoice(connection: ReservedSql, invoice: QueryInvoice) {
  const identityID = invoice.renewal_id || generateIdentityID();

  return withReservedTransaction(connection, async (transaction) => {
    const owners =
      invoice.owner === null ? [] : await transaction`SELECT id FROM users WHERE id = ${invoice.owner} AND deletion_requested_at IS NULL FOR UPDATE`;
    const identities = invoice.renewal_id
      ? await transaction`SELECT id FROM identities WHERE id = ${identityID} AND owner = ${invoice.owner} AND status <> 'deleting' FOR UPDATE`
      : [];

    if (!owners.length || (invoice.renewal_id && !identities.length)) {
      await transaction`UPDATE crypto_invoices SET status = 'reconciliation' WHERE id = ${invoice.id} AND status <> 'paid'`;

      return null;
    }

    const claimed = await transaction`UPDATE crypto_invoices SET status = 'paid' WHERE id = ${invoice.id} AND status <> 'paid' RETURNING id`;

    if (!claimed.length) {
      const existing = await transaction`SELECT id FROM identities WHERE crypto_invoice = ${invoice.id} AND owner = ${invoice.owner}`;

      return existing[0]?.id || null;
    }

    if (invoice.renewal_id) {
      await transaction`UPDATE identities SET crypto_invoice = ${invoice.id},
        status = CASE WHEN EXISTS (SELECT 1 FROM creation_jobs WHERE identity_id = ${identityID} AND status = 'completed') THEN 'active' ELSE 'inactive' END
        WHERE id = ${identityID} AND owner = ${invoice.owner} AND status <> 'deleting'`;
    } else {
      await transaction`INSERT INTO identities (id, owner, creation_date, plan, crypto_invoice)
        VALUES (${identityID}, ${invoice.owner}, ${new Date()}, ${invoice.plan}, ${invoice.id})`;
    }

    return identityID;
  });
}

async function observeInvoice(connection: ReservedSql, invoice: QueryInvoice, wallet = watchWallet) {
  const subaddress = await wallet.getAddressIndex(invoice.xmr_subaddress);
  const balance = await wallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex());
  const unlocked = await wallet.getUnlockedBalance(subaddress.getAccountIndex(), subaddress.getIndex());
  const required = parseXmr(invoice.xmr_amount);
  const previous = await connection`SELECT total, unlocked FROM invoice_observations WHERE invoice_id = ${invoice.id} ORDER BY id DESC LIMIT 1`;

  if (!previous.length || BigInt(previous[0].total) !== balance || BigInt(previous[0].unlocked) !== unlocked) {
    await connection`INSERT INTO invoice_observations (invoice_id, total, unlocked) VALUES (${invoice.id}, ${balance.toString()}, ${unlocked.toString()})`;
  }

  const first =
    await connection`SELECT MIN(observed_at) AS first_payment FROM invoice_observations WHERE invoice_id = ${invoice.id} AND total >= ${required.toString()}`;
  const expiry = new Date(invoice.creation_date).getTime() + PAYMENT_WINDOW_MIN * 60_000;
  const state = invoiceState(balance, unlocked, required, expiry, first[0].first_payment ? new Date(first[0].first_payment).getTime() : null, Date.now());
  let identityID: string | null = null;
  let status: string = state;

  if (state === 'paid') {
    identityID = await activateInvoice(connection, invoice);
    status = identityID ? 'paid' : 'reconciliation';
  } else if (state !== invoice.status) {
    await connection`UPDATE crypto_invoices SET status = ${state} WHERE id = ${invoice.id} AND status <> 'paid'`;
  }

  if (status === invoice.status) {
    return;
  }

  const remaining = required > balance ? required - balance : 0n;
  const remainingAmount = `${remaining / 1_000_000_000_000n}.${(remaining % 1_000_000_000_000n).toString().padStart(12, '0')}`;

  for (const ws of invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id)) {
    try {
      if (await ws.authorize()) {
        ws.websocket.send(JSON.stringify({status, identityID, remainingAmount}));
      }
    } catch {
      ws.websocket.close();
    }
  }
}

export async function pollFees(fetcher: typeof fetch = fetch) {
  const outcomes = await Promise.allSettled([
    providerJson(`${BTC_API}/v1/fees/recommended`, undefined, fetcher),
    providerJson(`${LTC_API}/v1/fees/recommended`, undefined, fetcher),
    providerJson(`${ETH_API}/v2/stats`, undefined, fetcher),
    providerJson(
      XMR_NODE,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_fee_estimate'}),
      },
      fetcher,
    ),
  ]);
  const values = outcomes.map((outcome) => (outcome.status === 'fulfilled' ? outcome.value : null));
  const candidates = {
    btc: {low: values[0]?.hourFee, medium: values[0]?.halfHourFee, high: values[0]?.fastestFee},
    ltc: {low: values[1]?.hourFee, medium: values[1]?.halfHourFee, high: values[1]?.fastestFee},
    eth: {low: values[2]?.gas_prices?.slow, medium: values[2]?.gas_prices?.average, high: values[2]?.gas_prices?.fast},
    xmr: {low: values[3]?.result?.fee, medium: values[3]?.result?.fee, high: values[3]?.result?.fee},
  };

  for (const coin of ['btc', 'ltc', 'eth', 'xmr'] as const) {
    const candidate = candidates[coin];

    if (Object.values(candidate).every((value) => Number.isFinite(value) && value > 0)) {
      cryptoFees[coin] = candidate;
    } else {
      delete cryptoFees[coin];
    }
  }

  if (cryptoFees.eth) {
    cryptoFees.usdt = cryptoFees.eth;
  } else {
    delete cryptoFees.usdt;
  }

  billingReadiness.feeSync = Date.now();
}

export async function pollPrices(fetcher: typeof fetch = fetch) {
  const response = await fetcher(COINGECKO_URL, {signal: AbortSignal.timeout(15_000)});

  if (!response.ok) {
    return;
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return;
  }

  for (const coin of ['btc', 'ltc', 'eth', 'usdt', 'xmr'] as const) {
    const entry = data.find((value) => value && value.symbol === coin);
    const chart = entry?.sparkline_in_7d?.price;

    if (
      !entry ||
      !Number.isFinite(entry.current_price) ||
      entry.current_price <= 0 ||
      !Number.isFinite(entry.price_change_percentage_24h) ||
      !Array.isArray(chart) ||
      !chart.length ||
      !chart.every(Number.isFinite)
    ) {
      delete cryptoPrices[coin];

      continue;
    }

    cryptoPrices[coin] = {dailyChange: entry.price_change_percentage_24h, usdPrice: entry.current_price, chart};
  }

  billingReadiness.priceSync = Date.now();
}

async function cleanupWorkers() {
  const identities = await sql`
    SELECT i.id, i.crypto_invoice, c.creation_date, c.plan
    FROM identities i
    JOIN crypto_invoices c ON i.crypto_invoice = c.id
    WHERE i.status = 'active' AND i.crypto_invoice IS NOT NULL
  `;

  const now = new Date().getTime();

  for (const identity of identities) {
    const creation = new Date(identity.creation_date).getTime();
    const days = (now - creation) / (1000 * 60 * 60 * 24);

    const condition1 = identity.plan === 'monthly' && days > 30;
    const condition2 = identity.plan === 'annually' && days > 365;

    if (condition1 || condition2) {
      await sql`UPDATE identities SET status = 'frozen' WHERE id = ${identity.id} AND crypto_invoice = ${identity.crypto_invoice} AND status = 'active'`;
    }
  }
}

async function runWorker(name: string, operation: () => Promise<unknown>, interval: number) {
  while (true) {
    try {
      await operation();
    } catch (failure) {
      reportFailure(name, failure);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export function initBackgroundWorkers() {
  void runWorker('Fee polling', pollFees, POLL_FEES_INTERVAL);
  void runWorker('Price polling', pollPrices, POLL_PRICES_INTERVAL);
  void runWorker('Identity expiry', cleanupWorkers, POLL_CLEANUP_INTERVAL);
  void runWorker('Identity deletion', repairIdentityDeletions, POLL_CLEANUP_INTERVAL);
  void runWorker('Account deletion', repairAccountDeletions, POLL_CLEANUP_INTERVAL);

  if (stripeConfig.secretKey) {
    void runWorker('Stripe reconciliation', repairStripeEvents, POLL_INVOICES_INTERVAL);
  }

  if (trocadorApiKey) {
    void runWorker('Payment exchange reconciliation', repairPaymentInvoices, POLL_INVOICES_INTERVAL);
    void runWorker('Wallet swap reconciliation', repairWalletSwapRequests, POLL_INVOICES_INTERVAL);
  }

  if (cryptoBillingEnabled && moneroWallet.address && moneroWallet.viewKey && moneroWallet.password) {
    void runWorker('Invoice polling', () => withBillingWallet(pollInvoices), POLL_INVOICES_INTERVAL);
  }
}
