import {BTC_API, COINGECKO_URL, ETH_API, LTC_API, XMR_NODE} from '@core/constants';
import {cryptoFees, cryptoPrices} from '@core/states';
import type {CoinGeckoResponse} from '@type';

async function safeFetch(url: string, fallback: any, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return fallback;
    return await res.json();
  } catch (_) {
    return fallback;
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
  try {
    const response = await fetch(COINGECKO_URL);
    if (!response.ok) return;

    const data = (await response.json()) as CoinGeckoResponse;

    data.forEach((element) => {
      cryptoPrices[element.symbol] = {
        dailyChange: element.price_change_percentage_24h,
        usdPrice: element.current_price,
        chart: element.sparkline_in_7d.price,
      };
    });
  } catch (_) {}
}

export function initBackgroundWorkers() {
  pollFees();
  pollPrices();

  setInterval(pollPrices, 300_000); // 5 min
  setInterval(pollFees, 180_000); // 3 min
}
