import {POLL_FEES_INTERVAL, POLL_PRICES_INTERVAL, POLL_INVOICES_INTERVAL, PAYMENT_WINDOW_MIN} from '@core/constants';
import {cryptoFees, cryptoPrices, invoiceConnections, watchWallet, setWatchWallet} from '@core/states';
import {BTC_API, ETH_API, LTC_API, XMR_NODE, COINGECKO_URL} from '@core/constants';
import {generateIdentityID} from '@utils/cryptography';
import type {CryptoCurrencies} from '@type';
import {moneroWallet} from '@core/config';
import {safeFetch} from '@utils/utils';
import {sql} from '@core/services';
import moneroTs from 'monero-ts';

async function initMoneroWallet() {
  const cacheQuery = await sql`SELECT keys_data, cache_data FROM wallet_cache WHERE id = 1`;

  if (cacheQuery.length > 0) {
    setWatchWallet(
      await moneroTs.openWalletFull({
        password: moneroWallet.password,
        networkType: moneroTs.MoneroNetworkType.MAINNET,
        server: XMR_NODE,
        keysData: cacheQuery[0].keys_data,
        cacheData: cacheQuery[0].cache_data,
      }),
    );
  } else {
    setWatchWallet(
      await moneroTs.createWalletFull({
        password: moneroWallet.password,
        networkType: moneroTs.MoneroNetworkType.MAINNET,
        primaryAddress: moneroWallet.address,
        privateViewKey: moneroWallet.viewKey,
        server: XMR_NODE,
        restoreHeight: 3300000,
      }),
    );
  }

  const saveWalletState = async () => {
    const data = await watchWallet.getData();
    const keysBuffer = Buffer.from(data[0].buffer, data[0].byteOffset, data[0].byteLength);
    const cacheBuffer = Buffer.from(data[1].buffer, data[1].byteOffset, data[1].byteLength);

    await sql`
      INSERT INTO wallet_cache (id, keys_data, cache_data)
      VALUES (1, ${keysBuffer}, ${cacheBuffer})
      ON CONFLICT (id) DO UPDATE SET
        keys_data = EXCLUDED.keys_data,
        cache_data = EXCLUDED.cache_data
    `;
  };

  watchWallet.addListener(
    new (class extends moneroTs.MoneroWalletListener {
      async onBalancesChanged() {
        await saveWalletState();
      }
      async onOutputReceived() {
        await saveWalletState();
      }
    })(),
  );

  await watchWallet.startSyncing(10_000);
}

async function pollInvoices() {
  if (!watchWallet) return;

  const invoices = await sql`SELECT * FROM crypto_invoices WHERE status IN ('pending', 'confirming', 'underpaid')`;

  for (const invoice of invoices) {
    const subaddress = await watchWallet.getAddressIndex(invoice.xmr_subaddress);
    const balance = await watchWallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex());
    const xmrAmount = BigInt(Math.round(parseFloat(invoice.xmr_amount) * 1e12));

    const isExpired = new Date().getTime() - new Date(invoice.creation_date).getTime() > PAYMENT_WINDOW_MIN * 60 * 1000;

    if (balance >= xmrAmount) {
      await sql`UPDATE crypto_invoices SET status = 'paid' WHERE id = ${invoice.id}`;

      let identityID;
      if (invoice.renewal_id) {
        identityID = invoice.renewal_id;
        await sql`UPDATE identities SET crypto_invoice = ${invoice.id}, status = 'active' WHERE id = ${identityID}`;
      } else {
        identityID = generateIdentityID();
        await sql`
          INSERT INTO identities (id, owner, creation_date, plan, crypto_invoice)
          VALUES (${identityID}, ${invoice.owner}, ${new Date()}, ${invoice.plan}, ${invoice.id})
        `;
      }

      const sockets = invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id);
      for (const ws of sockets) {
        ws.websocket.send(JSON.stringify({status: 'paid', identityID}));
      }
    } else if (balance > 0n && balance < xmrAmount) {
      if (invoice.status !== 'underpaid') {
        await sql`UPDATE crypto_invoices SET status = 'underpaid' WHERE id = ${invoice.id}`;
      }
      const remainingAmount = Number(xmrAmount - balance) / 1e12;
      const sockets = invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id);
      for (const ws of sockets) {
        ws.websocket.send(JSON.stringify({status: 'underpaid', remainingAmount}));
      }
    } else if (isExpired) {
      await sql`UPDATE crypto_invoices SET status = 'expired' WHERE id = ${invoice.id}`;
      const sockets = invoiceConnections.values().filter((ws) => ws.invoiceID === invoice.id);
      for (const ws of sockets) {
        ws.websocket.send(JSON.stringify({status: 'expired'}));
      }
    }
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

export function initBackgroundWorkers() {
  pollFees();
  pollPrices();
  initMoneroWallet();

  setInterval(pollFees, POLL_FEES_INTERVAL);
  setInterval(pollPrices, POLL_PRICES_INTERVAL);
  setInterval(pollInvoices, POLL_INVOICES_INTERVAL);
}
