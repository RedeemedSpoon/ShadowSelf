import {log, reportFailure, failureMessage} from '@logging';
import {withChainEndpoint, chainJson, ethereumRpc, requireEthereumMainnet} from '@core/providers/chain-requests';
import {repairCryptoRefunds} from '@core/billing/crypto-refunds';
import {repairStripeCleanup} from '@core/billing/stripe-cleanup';
import {enqueueBillingReceipt, processBillingReceipts} from '@core/billing/billing-receipts';
import {repairStripeEvents} from '@core/billing/stripe-service';
import {repairPaymentInvoices, repairWalletSwapRequests} from '@core/providers/swap-provider';
import {
  withBillingWallet,
  saveWalletState,
  parseXmr,
  invoiceState,
  entitlementEnd,
  fullPaymentTimestamp,
} from '@core/wallet/wallet-service';
import {POLL_FEES_INTERVAL, POLL_PRICES_INTERVAL, POLL_INVOICES_INTERVAL, POLL_CLEANUP_INTERVAL} from '@core/constants';
import {cryptoFees, cryptoPrices, invoiceConnections, billingWallet, billingReadiness} from '@core/states';
import {COINGECKO_URL, PRICING_TIERS} from '@core/constants';
import {PAYMENT_WINDOW_MIN, INVOICE_POLL_BATCH_SIZE, INVOICE_ACTIVE_MONITOR_MS} from '@core/constants';
import type {QueryInvoice} from '@type';
import {generateIdentityID} from '@utils/cryptography';
import {withReservedTransaction} from '@utils/utils';
import {sql} from '@core/services';
import {stripeConfig, moneroWallet, trocadorApiKey, emailConfig, dbConfig, chainEndpoints} from '@core/config';
import type {ReservedSql} from 'postgres';

let activeInvoiceCursor: string | null = null;
let archivedInvoiceCursor: string | null = null;

export async function processInvoiceBatch<T>(invoices: T[], process: (invoice: T) => Promise<void>) {
  let failed = 0;

  for (const invoice of invoices) {
    try {
      await process(invoice);
    } catch (failure) {
      failed += 1;
      reportFailure('Invoice processing; retained for retry', failure);
    }
  }

  return {processed: invoices.length, failed};
}

export async function pollInvoices(connection: ReservedSql, wallet = billingWallet) {
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
    WHERE status IN ('pending', 'confirming', 'underpaid', 'expired', 'late', 'reconciliation') AND xmr_subaddress IS NOT NULL
    AND creation_date >= ${cutoff} AND id > COALESCE(${activeInvoiceCursor}::uuid, '00000000-0000-0000-0000-000000000000'::uuid) ORDER BY id LIMIT ${INVOICE_POLL_BATCH_SIZE - archiveLimit}`;
  const archived = await connection`SELECT * FROM crypto_invoices
    WHERE status IN ('pending', 'confirming', 'underpaid', 'expired', 'late', 'reconciliation') AND xmr_subaddress IS NOT NULL
    AND creation_date < ${cutoff} AND id > COALESCE(${archivedInvoiceCursor}::uuid, '00000000-0000-0000-0000-000000000000'::uuid) ORDER BY id LIMIT ${archiveLimit}`;

  activeInvoiceCursor = active.length === INVOICE_POLL_BATCH_SIZE - archiveLimit ? active.at(-1)!.id : null;
  archivedInvoiceCursor = archived.length === archiveLimit ? archived.at(-1)!.id : null;

  const result = await processInvoiceBatch([...active, ...archived] as QueryInvoice[], (invoice) =>
    observeInvoice(connection, invoice, wallet),
  );

  if ((await wallet.getHeight()) !== height) {
    await saveWalletState(connection, wallet);
  }

  if (result.failed || Date.now() - started >= POLL_INVOICES_INTERVAL) {
    log(
      'info',
      `Invoice polling: ${result.processed} processed, ${result.failed} failed, ${archived.length} archived in ${Date.now() - started}ms`,
    );
  }

  return {...result, durationMs: Date.now() - started, archived: archived.length};
}

export async function activateInvoice(connection: ReservedSql, invoice: QueryInvoice) {
  const identityID = invoice.identity_id || generateIdentityID();

  return withReservedTransaction(connection, async (transaction) => {
    const owners =
      invoice.owner === null ? [] : await transaction`SELECT id FROM users WHERE id = ${invoice.owner} FOR UPDATE`;
    const identities = invoice.renewal
      ? await transaction`SELECT i.id, c.entitlement_start, c.plan FROM identities i
          LEFT JOIN crypto_invoices c ON c.id = i.crypto_invoice
          WHERE i.id = ${identityID} AND i.owner = ${invoice.owner} FOR UPDATE OF i`
      : [];

    if (!owners.length || (invoice.renewal && !identities.length)) {
      await transaction`UPDATE crypto_invoices SET status = 'reconciliation' WHERE id = ${invoice.id} AND status <> 'paid'`;

      return null;
    }

    const paidAt = new Date();
    const previousEnd = identities.length ? entitlementEnd(identities[0].entitlement_start, identities[0].plan) : null;
    const entitlementStart = new Date(Math.max(paidAt.getTime(), previousEnd?.getTime() ?? 0));
    const claimed = await transaction`UPDATE crypto_invoices SET status = 'paid', paid_at = ${paidAt},
      entitlement_start = ${entitlementStart}, identity_id = ${identityID} WHERE id = ${invoice.id} AND status <> 'paid' RETURNING id`;

    if (!claimed.length) {
      const existing =
        await transaction`SELECT id FROM identities WHERE crypto_invoice = ${invoice.id} AND owner = ${invoice.owner}`;

      return existing[0]?.id || null;
    }

    if (invoice.renewal) {
      await transaction`UPDATE identities SET crypto_invoice = ${invoice.id},
        status = CASE WHEN EXISTS (SELECT 1 FROM creation_jobs WHERE identity_id = ${identityID} AND status = 'completed') THEN 'active' ELSE 'inactive' END
        WHERE id = ${identityID} AND owner = ${invoice.owner}`;
    } else {
      await transaction`INSERT INTO identities (id, owner, creation_date, plan, crypto_invoice)
        VALUES (${identityID}, ${invoice.owner}, ${new Date()}, ${invoice.plan}, ${invoice.id})`;
    }

    await enqueueBillingReceipt(transaction, {
      owner: invoice.owner!,
      identityID,
      provider: 'crypto',
      providerReference: invoice.id,
      details: {
        identityID,
        plan: invoice.plan,
        renewal: invoice.renewal,
        paidAt: paidAt.toISOString(),
        amount: invoice.usd_amount,
        currency: 'USD',
        discount: (PRICING_TIERS[invoice.plan] / 100 - Number(invoice.usd_amount)).toFixed(4),
        tax: null,
        periodStart: entitlementStart.toISOString(),
        periodEnd: entitlementEnd(entitlementStart, invoice.plan)?.toISOString() || null,
        paymentMethod: 'Cryptocurrency',
        cryptoAmount: invoice.xmr_amount,
        cryptoCoin: 'XMR',
      },
    });

    return identityID;
  });
}

async function observeInvoice(connection: ReservedSql, invoice: QueryInvoice, wallet = billingWallet) {
  const subaddress = await wallet.getAddressIndex(invoice.xmr_subaddress);
  const balance = await wallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex());
  const unlocked = await wallet.getUnlockedBalance(subaddress.getAccountIndex(), subaddress.getIndex());
  const required = parseXmr(invoice.xmr_amount);
  const previous =
    await connection`SELECT total, unlocked FROM invoice_observations WHERE invoice_id = ${invoice.id} ORDER BY id DESC LIMIT 1`;

  if (!previous.length || BigInt(previous[0].total) !== balance || BigInt(previous[0].unlocked) !== unlocked) {
    await connection`INSERT INTO invoice_observations (invoice_id, total, unlocked) VALUES (${invoice.id}, ${balance.toString()}, ${unlocked.toString()})`;
  }

  const expiry = new Date(invoice.creation_date).getTime() + PAYMENT_WINDOW_MIN * 60_000;
  const transfers = await wallet.getIncomingTransfers({
    accountIndex: subaddress.getAccountIndex(),
    subaddressIndex: subaddress.getIndex(),
  });
  const observedAt = new Date();
  const payments = [];

  for (const transfer of transfers) {
    const transaction = transfer.getTx();

    if (transaction.getIsFailed() || transaction.getIsDoubleSpendSeen()) {
      continue;
    }

    const hash = transaction.getHash();
    await connection`INSERT INTO invoice_transfers (invoice_id, tx_hash, first_seen_at) VALUES (${invoice.id}, ${hash}, ${observedAt})
      ON CONFLICT (invoice_id, tx_hash) DO NOTHING`;
    const evidence = await connection`SELECT first_seen_at FROM invoice_transfers
      WHERE invoice_id = ${invoice.id} AND tx_hash = ${hash}`;
    const firstSeen = new Date(evidence[0].first_seen_at).getTime();
    const blockSeconds = transaction.getIsConfirmed() ? transaction.getBlock()?.getTimestamp() : undefined;
    const includedAt = Number.isSafeInteger(blockSeconds) && blockSeconds! > 0 ? blockSeconds! * 1000 : null;
    const timestamp = firstSeen <= expiry ? firstSeen : includedAt;
    payments.push({amount: transfer.getAmount(), timestamp});
  }

  const firstPayment = fullPaymentTimestamp(payments, required);
  const state = invoiceState(balance, unlocked, required, expiry, firstPayment, Date.now());
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

  for (const ws of [...invoiceConnections.values()].filter((ws) => ws.invoiceID === invoice.id)) {
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
  const feeQuote = (network: 'btc' | 'ltc') =>
    withChainEndpoint(network, async (endpoint, signal) => {
      if (network === 'ltc') {
        const estimate = await chainJson(`${endpoint}/v1/fees/recommended`, {signal}, fetcher);
        const quote = {hourFee: estimate.hourFee, halfHourFee: estimate.halfHourFee, fastestFee: estimate.fastestFee};

        if (Object.values(quote).some((value) => typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
          throw new Error('Litecoin fee estimates are unavailable');
        }

        return quote;
      }

      const estimate = await chainJson(`${endpoint}/fee-estimates`, {signal}, fetcher);
      const target = (blocks: number) => {
        const candidates = Object.entries(estimate).filter(
          ([key, value]) => Number(key) <= blocks && typeof value === 'number' && Number.isFinite(value) && value > 0,
        );
        candidates.sort(([left], [right]) => Number(right) - Number(left));

        return candidates[0]?.[1] as number | undefined;
      };
      const quote = {hourFee: target(6), halfHourFee: target(3), fastestFee: target(1)};

      if (Object.values(quote).some((value) => value === undefined)) {
        throw new Error('Fee estimates are unavailable');
      }

      return quote;
    });
  const outcomes = await Promise.allSettled([
    feeQuote('btc'),
    feeQuote('ltc'),
    withChainEndpoint('ethRpc', async (endpoint, signal) => {
      await requireEthereumMainnet(endpoint, signal, fetcher);

      const [block, tip] = await Promise.all([
        ethereumRpc(endpoint, 'eth_getBlockByNumber', ['latest', false], signal, fetcher),
        ethereumRpc(endpoint, 'eth_maxPriorityFeePerGas', [], signal, fetcher),
      ]);

      if (!/^0x[a-f0-9]+$/i.test(block?.baseFeePerGas || '') || !/^0x[a-f0-9]+$/i.test(tip || '')) {
        throw new Error('Ethereum fee estimates are unavailable');
      }

      const base = BigInt(block.baseFeePerGas) * 2n;
      const priority = BigInt(tip) || 1n;
      const units = (multiplier: bigint) => Number(base + priority * multiplier) / 1e9;

      return {gas_prices: {slow: units(1n), average: units(2n), fast: units(3n)}};
    }),
    withChainEndpoint('xmr', async (endpoint, signal) => {
      const data = await chainJson(
        endpoint,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_fee_estimate'}),
          signal,
        },
        fetcher,
      );

      if (data.error || !Number.isFinite(data.result?.fee) || data.result.fee <= 0) {
        throw new Error('Monero fee estimates are unavailable');
      }

      return data;
    }),
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
  await sql`DELETE FROM sessions WHERE expires_at <= NOW()`;
  await sql`UPDATE identities i SET status = 'frozen'
    FROM crypto_invoices c WHERE i.crypto_invoice = c.id AND i.status = 'active'
    AND c.entitlement_start IS NOT NULL
    AND ((c.plan = 'monthly' AND c.entitlement_start + INTERVAL '30 days' <= NOW())
      OR (c.plan = 'annually' AND c.entitlement_start + INTERVAL '365 days' <= NOW()))`;
}

async function runWorker(name: string, operation: () => Promise<unknown>, interval: number) {
  let previousFailure = '';

  while (true) {
    try {
      await operation();

      if (previousFailure) {
        log('success', `${name}: recovered`);
        previousFailure = '';
      }
    } catch (failure) {
      const message = failureMessage(failure);

      if (message !== previousFailure) {
        log('error', `${name}: ${message}; retry in ${interval / 1000}s`);
        previousFailure = message;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export function initBackgroundWorkers() {
  if (
    [chainEndpoints.btc, chainEndpoints.ltc, chainEndpoints.ethRpc, chainEndpoints.xmr].some(
      (endpoints) => endpoints.length,
    )
  ) {
    void runWorker('Fee polling', pollFees, POLL_FEES_INTERVAL);
  }

  void runWorker('Price polling', pollPrices, POLL_PRICES_INTERVAL);

  if (!dbConfig.password) {
    return;
  }

  void runWorker('Identity expiry', cleanupWorkers, POLL_CLEANUP_INTERVAL);

  if (emailConfig.billingPassword && emailConfig.host) {
    void runWorker('Billing receipt delivery', processBillingReceipts, POLL_INVOICES_INTERVAL);
  }

  if (stripeConfig.secretKey) {
    void runWorker('Stripe reconciliation', repairStripeEvents, POLL_INVOICES_INTERVAL);
    void runWorker('Stripe cleanup', repairStripeCleanup, POLL_INVOICES_INTERVAL);
  }

  if (trocadorApiKey) {
    void runWorker('Payment exchange reconciliation', repairPaymentInvoices, POLL_INVOICES_INTERVAL);
    void runWorker('Wallet swap reconciliation', repairWalletSwapRequests, POLL_INVOICES_INTERVAL);
  }

  if (
    moneroWallet.address &&
    moneroWallet.viewKey &&
    moneroWallet.spendKey &&
    moneroWallet.password &&
    chainEndpoints.xmr.length
  ) {
    void runWorker('Invoice polling', () => withBillingWallet(pollInvoices), POLL_INVOICES_INTERVAL);
    void runWorker('Crypto refunds', repairCryptoRefunds, POLL_INVOICES_INTERVAL);
  }
}
