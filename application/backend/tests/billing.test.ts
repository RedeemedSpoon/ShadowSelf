import {describe, expect, test} from 'bun:test';
import {createSwapProvider} from '@core/swap-provider';
import {invoiceState, parseXmr, quoteXmr, saveWalletState} from '@core/wallet-service';
import {setWatchWallet} from '@core/states';
import {cryptoFees, cryptoPrices} from '@core/states';
import {pollFees, pollPrices} from '@core/background-workers';
import type {watchWallet} from '@core/states';
import type {ReservedSql} from 'postgres';

const trade = {
  trade_id: 'synthetic-trade',
  ticker_from: 'btc',
  ticker_to: 'xmr',
  network_from: 'Mainnet',
  network_to: 'Mainnet',
  address_provider: 'synthetic-deposit',
  address_provider_memo: '82719',
  address_user: 'synthetic-destination',
  refund_address: 'synthetic-refund',
  amount_from: '0.001',
  amount_to: '0.1',
  status: 'waiting',
  id_provider: 'synthetic-provider-id',
};
const request = {
  tradeID: trade.trade_id,
  coinFrom: trade.ticker_from,
  coinTo: trade.ticker_to,
  destinationAddress: trade.address_user,
  refundAddress: trade.refund_address,
  amount: Number(trade.amount_from),
};

function providerFixture(payload: unknown) {
  const urls: URL[] = [];
  const fetcher = (async (url: string | URL | Request) => {
    urls.push(new URL(String(url)));

    return Response.json(payload);
  }) as typeof fetch;

  return {provider: createSwapProvider(fetcher, 'synthetic-api-key'), urls};
}

describe('billing amounts and settlement', () => {
  test('quotes round upward to atomic precision and reject invalid inputs', () => {
    expect(quoteXmr(499, 20, 200)).toBe('0.019960000000');
    expect(parseXmr(quoteXmr(1, 0, 3))).toBe(3_333_333_334n);
    expect(() => parseXmr('0.0000000000001')).toThrow();
    expect(() => quoteXmr(499, 100, 200)).toThrow();
    expect(() => quoteXmr(499, 20, 0)).toThrow();
  });

  test('confirmation and late payment states preserve the payment window', () => {
    expect(invoiceState(0n, 0n, 10n, 100, null, 50)).toBe('pending');
    expect(invoiceState(0n, 0n, 10n, 100, null, 100)).toBe('expired');
    expect(invoiceState(5n, 5n, 10n, 100, null, 150)).toBe('underpaid');
    expect(invoiceState(10n, 0n, 10n, 100, 90, 150)).toBe('confirming');
    expect(invoiceState(10n, 10n, 10n, 100, 90, 150)).toBe('paid');
    expect(invoiceState(10n, 10n, 10n, 100, 110, 150)).toBe('late');
    expect(() => invoiceState(10n, 11n, 10n, 100, 90, 150)).toThrow();
  });

  test('unchanged wallet data avoids writes while changed data increments revision', async () => {
    let revision = 0;
    let bytes = new Uint8Array([11, 29]);
    const database = (async () => [{revision: ++revision}]) as unknown as ReservedSql;
    setWatchWallet({getData: async () => [bytes, new Uint8Array([87, 31])]} as unknown as typeof watchWallet);

    await saveWalletState(database);
    await saveWalletState(database);

    expect(revision).toBe(1);

    bytes = new Uint8Array([11, 30]);
    await saveWalletState(database);

    expect(revision).toBe(2);
  });
});

describe('independent market availability', () => {
  test('one unavailable fee dependency preserves healthy coins', async () => {
    const fetcher = (async (url: string | URL | Request) => {
      const target = String(url);

      if (target.includes('litecoinspace')) {
        return new Response('Synthetic provider outage', {status: 503});
      }

      if (target.includes('blockscout')) {
        return Response.json({gas_prices: {slow: 2, average: 3, fast: 4}});
      }

      if (target.includes('cakewallet')) {
        return Response.json({result: {fee: 5}});
      }

      return Response.json({hourFee: 1, halfHourFee: 2, fastestFee: 3});
    }) as typeof fetch;

    await pollFees(fetcher);

    expect(cryptoFees.btc?.medium).toBe(2);
    expect(cryptoFees.ltc).toBeUndefined();
    expect(cryptoFees.eth).toEqual(cryptoFees.usdt);
    expect(cryptoFees.xmr?.medium).toBe(5);
  });

  test('missing and invalid price entries stay unavailable without fabricated values', async () => {
    const payload = [
      {symbol: 'btc', current_price: 60000, price_change_percentage_24h: 2, sparkline_in_7d: {price: [59900, 60000]}},
      {symbol: 'ltc', current_price: 50, price_change_percentage_24h: null, sparkline_in_7d: {price: [50]}},
      {symbol: 'xmr', current_price: 200, price_change_percentage_24h: 1, sparkline_in_7d: {price: []}},
    ];
    await pollPrices((async (_url: string | URL | Request) => Response.json(payload)) as typeof fetch);

    expect(cryptoPrices.btc?.usdPrice).toBe(60000);
    expect(cryptoPrices.ltc).toBeUndefined();
    expect(cryptoPrices.xmr).toBeUndefined();
    expect(cryptoPrices.eth).toBeUndefined();
  });
});

describe('exchange recovery', () => {
  test('lookup recovers exact deposit memo without creating another trade', async () => {
    const {provider, urls} = providerFixture([trade]);
    const result = await provider.reconcile(request);

    expect(result?.depositMemo).toBe('82719');
    expect(result?.depositAmount).toBe('0.001');
    expect(result?.depositAddress).toBe(trade.address_provider);
    expect(urls.map((url) => url.pathname)).toEqual(['/trade']);
    expect(urls[0].searchParams.get('id')).toBe(trade.trade_id);
  });

  test('an uncreated quote remains uncertain without an external mutation', async () => {
    const {provider, urls} = providerFixture({...trade, status: 'new'});

    expect(await provider.reconcile(request)).toBeNull();
    expect(urls.map((url) => url.pathname)).toEqual(['/trade']);
  });

  test.each([
    {address_user: 'different-destination'},
    {refund_address: 'different-refund'},
    {ticker_from: 'eth'},
    {network_from: 'ERC20'},
    {amount_from: '0.002'},
    {trade_id: 'different-trade'},
  ])('mismatched trade details cannot satisfy recovery: %j', async (difference) => {
    const {provider} = providerFixture({...trade, ...difference});

    await expect(provider.reconcile(request)).rejects.toThrow('does not match');
  });

  test('payment recovery requires the quoted Monero destination amount', async () => {
    const {provider} = providerFixture(trade);

    await expect(provider.reconcile({...request, amount: undefined, receiveAmount: '0.2'})).rejects.toThrow('does not match');
  });

  test('payment recovery compares decimal amounts without floating point loss', async () => {
    const {provider} = providerFixture({...trade, amount_to: '12345678.123456789013'});

    await expect(provider.reconcile({...request, amount: undefined, receiveAmount: '12345678.123456789012'})).rejects.toThrow('does not match');
  });

  test.each([null, {error: 'synthetic failure'}, {...trade, address_provider: ''}, {...trade, amount_from: 'NaN'}])(
    'invalid provider responses never supply payment instructions: %j',
    async (payload) => {
      const {provider} = providerFixture(payload);

      await expect(provider.reconcile(request)).rejects.toThrow();
    },
  );
});
