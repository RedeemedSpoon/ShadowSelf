import {beforeEach, expect, mock, test} from 'bun:test';
import {Elysia} from 'elysia';
import {billingReadiness, cryptoFees, cryptoPrices} from '../src/core/states';

const scopedRequests: string[] = [];
const keys = {btc: 'synthetic-btc-public-key', ltc: 'synthetic-ltc-public-key', evm: '0x' + '1'.repeat(40)};
const identity = {id: 'a'.repeat(12), wallet_keys: keys};
let outcomes: PromiseSettledResult<unknown>[] = [];

mock.module('../src/middlewares/middleware-api', () => ({default: (app: Elysia) => app.derive(() => ({user: {accountID: 71}, identity}))}));
mock.module('../src/core/chain-provider', () => ({
  chainProvider: {
    overview: async (scope: string) => {
      scopedRequests.push(scope);

      return outcomes;
    },
  },
}));

const {default: walletRoutes} = await import('../src/routes/public-api/api-crypto');
const app = new Elysia().use(walletRoutes);

beforeEach(() => {
  scopedRequests.length = 0;
  outcomes = [
    {status: 'rejected', reason: new Error('synthetic provider failure')},
    ...[2, 3, 4].map((balance) => ({status: 'fulfilled' as const, value: {status: 'Synced', balance, history: []}})),
  ];
  billingReadiness.priceSync = Date.now();
  billingReadiness.feeSync = Date.now();
  Object.assign(cryptoPrices, {btc: {usdPrice: 10, dailyChange: 0, chart: [9, 10]}, ltc: {usdPrice: 0, dailyChange: 0, chart: []}});
  Object.assign(cryptoFees, {btc: {low: 1, medium: 2, high: 3}, ltc: {low: 0, medium: 0, high: 0}});
});

test('returns null for an unavailable coin and retains successful coins and valid market data', async () => {
  const response = await app.handle(new Request(`http://localhost/api/identities/${identity.id}/wallet`));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.wallet.btc).toMatchObject({status: 'Unavailable', balance: null, history: []});
  expect(body.wallet.ltc.balance).toBe(2);
  expect(body.wallet.usdt.balance).toBe(4);
  expect(body.prices.btc.usdPrice).toBe(10);
  expect(body.prices.ltc).toBeUndefined();
  expect(body.fees.btc.medium).toBe(2);
  expect(body.fees.ltc).toBeUndefined();
  expect(scopedRequests).toEqual([`71:${identity.id}`]);
});

test('stale market data does not suppress successfully read chain balances', async () => {
  billingReadiness.priceSync = 0;
  billingReadiness.feeSync = 0;
  const response = await app.handle(new Request(`http://localhost/api/identities/${identity.id}/wallet`));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.wallet.eth.balance).toBe(3);
  expect(body.prices).toEqual({});
  expect(body.fees).toEqual({});
});
