import type { CoinGeckoResponse, CryptoFees, CryptoPrices } from "@types";

export const cryptoFees = {} as CryptoFees;
export const cryptoPrices = {} as CryptoPrices;

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3/coins/markets"
const COINGECKO_PARAMS = "?vs_currency=usd&ids=bitcoin,litecoin,ethereum,tether,monero&sparkline=true"

async function pollPrices() {
  const response = await fetch(COINGECKO_BASE_URL + COINGECKO_PARAMS)
  if (!response.ok) return

  const data = await response.json() as CoinGeckoResponse

  data.forEach(element => {
    cryptoPrices[element.id] = {
      daily_change: element.price_change_percentage_24h,
      to_usd: element.current_price,
      chart: element.sparkline_in_7d.price
    }
  });
}

async function pollFees() { }

pollPrices()
pollFees()
setInterval(pollPrices, 300_000);    // Every 5 minutes
setInterval(pollFees, 30_000);       // Every 30 seconds
