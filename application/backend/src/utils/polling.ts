import type {CoinGeckoResponse, CryptoFees, CryptoPrices} from '@types';

export const cryptoFees = {} as CryptoFees;
export const cryptoPrices = {} as CryptoPrices;

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const COINGECKO_PARAMS = '?vs_currency=usd&ids=bitcoin,litecoin,ethereum,tether,monero&sparkline=true';

const BTC_URL = 'https://mempool.space/api/v1/fees/recommended';
const LTC_URL = 'https://litecoinspace.org/api/v1/fees/recommended';
const XMR_URL = 'http://xmr-node.cakewallet.com:18081/json_rpc';
const ETH_URL = 'https://eth.llamarpc.com';

async function pollPrices() {
  const response = await fetch(COINGECKO_BASE_URL + COINGECKO_PARAMS);
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
  const [btcRes, ltcRes] = await Promise.all([fetch(BTC_URL).then((r) => r.json()), fetch(LTC_URL).then((r) => r.json())]);

  const ethRes = await fetch(ETH_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1}),
  }).then((r) => r.json());

  const xmrRes = await fetch(XMR_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_fee_estimate'}),
  }).then((r) => r.json());

  cryptoFees.btc = btcRes.halfHourFee;
  cryptoFees.ltc = ltcRes.halfHourFee;
  cryptoFees.xmr = xmrRes.result?.fee || 0;
  cryptoFees.eth = parseInt(ethRes.result, 16) / 1_000_000_000;
  cryptoFees.usdt = parseInt(ethRes.result, 16) / 1_000_000_000;
}

pollFees();
pollPrices();
setInterval(pollPrices, 300_000); // Every 5 minutes
setInterval(pollFees, 60_000); // Every 1 minute
