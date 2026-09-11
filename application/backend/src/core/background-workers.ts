import {repairStripeEvents} from '@core/stripe-service';
import {withBillingWallet, saveWalletState, parseXmr, invoiceState} from '@core/wallet-service';
import {POLL_FEES_INTERVAL, POLL_PRICES_INTERVAL, POLL_INVOICES_INTERVAL, POLL_CLEANUP_INTERVAL} from '@core/constants';
import {cryptoFees, cryptoPrices, invoiceConnections, watchWallet} from '@core/states';
import {BTC_API, ETH_API, LTC_API, XMR_NODE, COINGECKO_URL} from '@core/constants';
import {PAYMENT_WINDOW_MIN} from '@core/constants';
import type {CryptoCurrencies, QueryInvoice} from '@type';
import {generateIdentityID} from '@utils/cryptography';
import {safeFetch} from '@utils/utils';
import {sql} from '@core/services';

async function pollInvoices() {
  if (!watchWallet) return;

  await watchWallet.sync();
  const invoices =
    (await sql`SELECT * FROM crypto_invoices WHERE status IN ('pending', 'confirming', 'underpaid', 'expired', 'late') AND xmr_subaddress IS NOT NULL`) as QueryInvoice[];
  let stateChanged = false;

  for (const invoice of invoices) {
    const subaddress = await watchWallet.getAddressIndex(invoice.xmr_subaddress);
    const balance = await watchWallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex());
    const unlocked = await watchWallet.getUnlockedBalance(subaddress.getAccountIndex(), subaddress.getIndex());
    const xmrAmount = parseXmr(invoice.xmr_amount);
    await sql`INSERT INTO invoice_observations (invoice_id, total, unlocked)
      SELECT ${invoice.id}, ${balance.toString()}, ${unlocked.toString()}
      WHERE NOT EXISTS (SELECT 1 FROM (SELECT total, unlocked FROM invoice_observations WHERE invoice_id = ${invoice.id} ORDER BY id DESC LIMIT 1) latest
        WHERE total = ${balance.toString()} AND unlocked = ${unlocked.toString()})`;
    const first = await sql`SELECT MIN(observed_at) AS first_payment FROM invoice_observations WHERE invoice_id = ${invoice.id} AND total > 0`;
    const expiry = new Date(invoice.creation_date).getTime() + PAYMENT_WINDOW_MIN * 60_000;
    const state = invoiceState(balance, unlocked, xmrAmount, expiry, first[0].first_payment ? new Date(first[0].first_payment).getTime() : null, Date.now());

    if (state === 'paid') {
      stateChanged = true;
      const identityID = invoice.renewal_id || generateIdentityID();
      const activated = await sql.begin(async (transaction) => {
        const claimed = await transaction`UPDATE crypto_invoices SET status = 'paid' WHERE id = ${invoice.id} AND status <> 'paid' RETURNING id`;
        if (!claimed.length) return false;

        if (invoice.renewal_id) {
          await transaction`UPDATE identities SET crypto_invoice = ${invoice.id}, status = 'active' WHERE id = ${identityID} AND owner = ${invoice.owner} AND status <> 'deleting'`;
        } else {
          await transaction`INSERT INTO identities (id, owner, creation_date, plan, crypto_invoice)
            VALUES (${identityID}, ${invoice.owner}, ${new Date()}, ${invoice.plan}, ${invoice.id})`;
        }

        return true;
      });
      if (!activated) continue;

      const sockets = invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id);
      for (const ws of sockets) {
        if (await ws.authorize()) ws.websocket.send(JSON.stringify({status: 'paid', identityID}));
      }
    } else if (state === 'underpaid') {
      if (invoice.status !== 'underpaid') {
        stateChanged = true;
        await sql`UPDATE crypto_invoices SET status = 'underpaid' WHERE id = ${invoice.id}`;
      }
      const remainingAmount = Number(xmrAmount - balance) / 1e12;
      const sockets = invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id);
      for (const ws of sockets) {
        if (await ws.authorize()) ws.websocket.send(JSON.stringify({status: 'underpaid', remainingAmount}));
      }
    } else {
      await sql`UPDATE crypto_invoices SET status = ${state} WHERE id = ${invoice.id} AND status <> 'paid'`;
      const sockets = invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id);
      for (const ws of sockets) {
        if (await ws.authorize()) ws.websocket.send(JSON.stringify({status: state}));
      }
    }
  }

  if (stateChanged || invoices.length > 0) {
    await saveWalletState();
  }
}

async function pollFees() {
  const btcFB = {hourFee: 0, halfHourFee: 0, fastestFee: 0};
  const ethFB = {gas_prices: {slow: 0, average: 0, fast: 0}};
  const xmrFB = {result: {fee: 0}};

  const [btc, ltc, eth] = await Promise.all([
    safeFetch(`${BTC_API}/v1/fees/recommended`, btcFB),
    safeFetch(`${LTC_API}/v1/fees/recommended`, btcFB),
    safeFetch(`${ETH_API}/v2/stats`, ethFB),
  ]);

  const xmr = await safeFetch(XMR_NODE, xmrFB, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_fee_estimate'}),
  });

  cryptoFees.btc = {low: btc.hourFee, medium: btc.halfHourFee, high: btc.fastestFee};
  cryptoFees.ltc = {low: ltc.hourFee, medium: ltc.halfHourFee, high: ltc.fastestFee};

  const eGas = eth.gas_prices || {};
  const eBase = eGas.average || 0;
  cryptoFees.eth = {low: eGas.slow || eBase, medium: eBase, high: eGas.fast || eBase};
  cryptoFees.usdt = cryptoFees.eth;

  const xFee = xmr.result?.fee || 0;
  cryptoFees.xmr = {low: xFee, medium: xFee, high: xFee};
}

async function pollPrices() {
  const response = await fetch(COINGECKO_URL);
  if (!response.ok) return;

  const data = await response.json();
  data.forEach((element: any) => {
    cryptoPrices[element.symbol as CryptoCurrencies] = {
      dailyChange: element.price_change_percentage_24h,
      usdPrice: element.current_price,
      chart: element.sparkline_in_7d.price,
    };
  });
}

async function cleanupWorkers() {
  const identities = await sql`
    SELECT i.id, c.creation_date, c.plan
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
      await sql`UPDATE identities SET status = 'frozen' WHERE id = ${identity.id}`;
    }
  }
}

export async function initBackgroundWorkers() {
  await Promise.allSettled([pollFees(), pollPrices(), cleanupWorkers()]);

  setInterval(() => void pollFees().catch(() => {}), POLL_FEES_INTERVAL);
  setInterval(() => void pollPrices().catch(() => {}), POLL_PRICES_INTERVAL);
  setInterval(() => void cleanupWorkers().catch(() => {}), POLL_CLEANUP_INTERVAL);

  while (true) {
    await repairStripeEvents().catch(() => {});
    try {
      await withBillingWallet(pollInvoices);
    } catch {
      console.error('Wallet polling failed; billing will retry');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INVOICES_INTERVAL));
  }
}
