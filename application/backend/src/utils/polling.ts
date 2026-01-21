import type {CoinGeckoResponse, CryptoFees, CryptoPrices, CryptoWalletResponse} from '@types';

export const cryptoFees = {} as CryptoFees;
export const cryptoPrices = {} as CryptoPrices;

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3/coins/markets';
const COINGECKO_PARAMS = '?vs_currency=usd&ids=bitcoin,litecoin,ethereum,tether,monero&sparkline=true';

const BTC_API = 'https://mempool.space/api';
const LTC_API = 'https://litecoinspace.org/api';
const ETH_API = 'https://eth.blockscout.com/api';
const XMR_NODE = 'http://xmr-node.cakewallet.com:18081/json_rpc';
const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';

// --- DATA FETCHERS ---
export async function getUtxoData(coin: 'btc' | 'ltc', address: string): Promise<CryptoWalletResponse['btc']> {
  const baseUrl = coin === 'btc' ? BTC_API : LTC_API;

  try {
    const [infoRes, utxoRes, txsRes] = await Promise.all([
      fetch(`${baseUrl}/address/${address}`),
      fetch(`${baseUrl}/address/${address}/utxo`),
      fetch(`${baseUrl}/address/${address}/txs`),
    ]);

    if (!infoRes.ok) return {status: 'Network Error', balance: 0, utxos: [], history: []};

    const info = await infoRes.json();
    const utxos = utxoRes.ok ? await utxoRes.json() : [];
    const rawTxs = txsRes.ok ? await txsRes.json() : [];

    const history = rawTxs.map((tx: any) => {
      let sent = 0;
      let received = 0;
      let counterparty = 'Unknown';

      tx.vin.forEach((vin: any) => {
        if (vin.prevout.scriptpubkey_address === address) sent += vin.prevout.value;
        else counterparty = vin.prevout.scriptpubkey_address;
      });

      tx.vout.forEach((vout: any) => {
        if (vout.scriptpubkey_address === address) received += vout.value;
        else if (sent > 0) counterparty = vout.scriptpubkey_address;
      });

      const net = received - sent;

      return {
        txid: tx.txid,
        type: net > 0 ? 'received' : 'sent',
        amount: Math.abs(net) / 100_000_000,
        date: new Date(tx.status.block_time * 1000),
        counterparty: counterparty || 'Multiple',
      };
    });

    const cs = info.chain_stats;
    const ms = info.mempool_stats;
    const balance = (cs.funded_txo_sum - cs.spent_txo_sum + ms.funded_txo_sum - ms.spent_txo_sum) / 100_000_000;
    const status = info.mempool_stats.tx_count > 0 ? 'Incoming...' : 'Synced';

    return {status, balance, utxos, history};
  } catch (e) {
    return {status: 'Network Error', balance: 0, utxos: [], history: []};
  }
}

export async function getEvmData(coin: 'eth' | 'usdt', address: string) {
  const ethBalanceUrl = `${ETH_API}?module=account&action=balance&address=${address}`;
  const usdtbalanceUrl = `${ETH_API}?module=account&action=tokenbalance&contractaddress=${USDT_CONTRACT}&address=${address}`;
  const balanceUrl = coin === 'eth' ? ethBalanceUrl : usdtbalanceUrl;

  const nonceUrl = `${ETH_API}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`;
  const historyUrl = `${ETH_API}?module=account&action=${coin === 'eth' ? 'txlist' : 'tokentx'}&address=${address}${coin === 'usdt' ? `&contractaddress=${USDT_CONTRACT}` : ''}`;

  try {
    const [balRes, nonceRes, histRes] = await Promise.all([fetch(balanceUrl), fetch(nonceUrl), fetch(historyUrl)]);

    const balData = await balRes.json();
    const nonceData = await nonceRes.json();
    const histData = await histRes.json();

    let balance = 0;
    if (balData.status === '1' || coin === 'usdt') {
      const rawVal = balData.result || balData;
      balance = parseFloat(rawVal) / (coin === 'eth' ? 1e18 : 1e6);
    }

    const nonce = parseInt(nonceData.result, 16) || 0;

    let history: any[] = [];
    if (histData.status === '1' && Array.isArray(histData.result)) {
      history = histData.result.slice(0, 50).map((tx: any) => ({
        txid: tx.hash,
        type: tx.to.toLowerCase() === address.toLowerCase() ? 'received' : 'sent',
        counterparty: tx.to.toLowerCase() === address.toLowerCase() ? tx.from : tx.to,
        amount: parseFloat(tx.value) / (coin === 'usdt' ? 1e6 : 1e18),
        date: new Date(parseInt(tx.timeStamp) * 1000),
      }));
    }

    return {status: 'Synced', balance: balance || 0, nonce, history};
  } catch (e) {
    return {status: 'Network Error', balance: 0, nonce: 0, history: []};
  }
}

export async function getXmrNode() {
  try {
    const response = await fetch(XMR_NODE, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_info'}),
    });

    const info = (await response.json()).result;
    let status = 'Network Operational';

    if (info.status !== 'OK') status = 'Node Busy';
    if (info.offline) status = 'Node Offline';
    if (info.target_height > 0 && info.target_height - info.height > 5) {
      status = `Syncing (${info.height}/${info.target_height})`;
    }

    return {status, node_url: XMR_NODE};
  } catch (e) {
    return {status: 'Network Error', node_url: XMR_NODE};
  }
}

// --- BACKGROUND WORKERS (FEES & PRICES) ---
async function pollPrices() {
  const response = await fetch(COINGECKO_BASE + COINGECKO_PARAMS);
  if (!response.ok) return;

  const data = (await response.json()) as CoinGeckoResponse;

  data.forEach((element) => {
    cryptoPrices[element.id] = {
      daily_change: element.price_change_percentage_24h,
      to_usd: element.current_price,
      chart: element.sparkline_in_7d.price,
    };
  });
}

async function pollFees() {
  const [btcRes, ltcRes, ethRes] = await Promise.all([
    fetch(`${BTC_API}/v1/fees/recommended`).then((r) => r.json()),
    fetch(`${LTC_API}/v1/fees/recommended`).then((r) => r.json()),
    fetch(`${ETH_API}/v2/stats`).then((r) => r.json()),
  ]);

  const xmrRes = await fetch(XMR_NODE, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_fee_estimate'}),
  }).then((r) => r.json());

  cryptoFees.btc = btcRes.halfHourFee;
  cryptoFees.ltc = ltcRes.halfHourFee;
  cryptoFees.eth = ethRes.gas_prices.average;
  cryptoFees.usdt = ethRes.gas_prices.average;
  cryptoFees.xmr = xmrRes.result?.fee || 0;
}

pollFees();
pollPrices();
setInterval(pollPrices, 300_000); // 5 min
setInterval(pollFees, 60_000); // 1 min
