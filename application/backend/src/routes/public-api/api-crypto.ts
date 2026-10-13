import {cryptoFees, cryptoPrices, billingReadiness, throttle, useCache} from '@core/states';
import {POLL_FEES_INTERVAL, POLL_PRICES_INTERVAL, UUID_PATTERN} from '@core/constants';
import {chainProvider} from '@core/chain-provider';
import {swapProvider} from '@core/swap-provider';
import {requireProvider, ApiError} from '@core/security';
import {trocadorApiKey} from '@core/config';
import middlewareApi from '@middlewares/middleware-api';
import {checkAPI} from '@utils/checks';
import {error} from '@utils/utils';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/api/identities/:id/wallet'})
  .use(middlewareApi)
  .get('/node', async ({identity}) => ({startingDate: identity!.creation_date, ...(await chainProvider.node())}))
  .get(
    '/',
    async ({identity}) => {
      if (Date.now() - billingReadiness.priceSync > POLL_PRICES_INTERVAL * 3 || Date.now() - billingReadiness.feeSync > POLL_FEES_INTERVAL * 3) {
        throw new ApiError(503, 'market_data_unavailable', 'Wallet prices or transaction fees are unavailable');
      }

      const keys = identity!.wallet_keys;
      const [btc, ltc, eth, usdt] = await Promise.all([
        chainProvider.utxo('btc', keys.btc),
        chainProvider.utxo('ltc', keys.ltc),
        chainProvider.evm('eth', keys.evm),
        chainProvider.evm('usdt', keys.evm),
      ]);

      const wallet = {btc, ltc, eth, usdt};

      return {prices: cryptoPrices, fees: cryptoFees, wallet};
    },
    useCache('Wallet overview', 60_000),
  )
  .get(
    '/swap-quotes',
    async ({query, set}) => {
      const input = await checkAPI(query, ['coinTo', 'coinFrom', 'amount']);

      if (input.err) {
        return error(set, 400, input.err);
      }

      return await swapProvider.quote(input);
    },
    throttle('Swap quotes', 5_000),
  )
  .post('/swaps', async ({body, set, user, identity}) => {
    const fields = ['tradeID', 'coinTo', 'coinFrom', 'amount', 'destinationAddress', 'refundAddress', 'provider', 'isFixed'];
    const input = await checkAPI(body, fields);

    if (input.err) {
      return error(set, 400, input.err);
    }

    requireProvider(!!trocadorApiKey, 'Crypto exchange');

    const requestID = (body as {requestID?: string})?.requestID;

    if (!UUID_PATTERN.test(requestID || '')) {
      return error(set, 400, 'A request ID is required');
    }

    const request = Object.fromEntries(fields.map((field) => [field, (input as unknown as Record<string, unknown>)[field]]));
    await sql`INSERT INTO wallet_swaps (owner, request_id, identity_id, request)
      VALUES (${user!.accountID}, ${requestID!}, ${identity!.id}, ${sql.json(request as never)}) ON CONFLICT (owner, request_id) DO NOTHING`;

    const rows = await sql`SELECT * FROM wallet_swaps WHERE owner = ${user!.accountID} AND request_id = ${requestID!}`;

    const swap = rows[0];

    if (swap.identity_id !== identity!.id || fields.some((field) => swap.request[field] !== request[field])) {
      return error(set, 409, 'This request ID has different trade details');
    }

    if (swap.response) {
      return swap.response;
    }

    const claimed = await sql`UPDATE wallet_swaps SET status = 'requested' WHERE id = ${swap.id} AND status = 'pending' RETURNING id`;

    if (!claimed.length) {
      return error(set, 503, 'Trade outcome is uncertain. Review the existing provider trade before another request');
    }

    const response = await swapProvider.trade(input);
    await sql`UPDATE wallet_swaps SET response = ${sql.json(response)}, status = 'completed' WHERE id = ${swap.id}`;

    return response;
  })
  .post(
    '/transactions',
    async ({body, set}) => {
      const {err, hex, coin} = await checkAPI(body, ['hex', 'coin']);

      if (err) {
        return error(set, 400, err);
      }

      return await chainProvider.broadcast(coin, hex);
    },
    throttle('Broadcast', 10_000),
  )
  .post(
    '/sweep',
    async ({body, set}) => {
      const {err, coin, addresses} = await checkAPI(body, ['coin', 'addresses']);

      if (err) {
        return error(set, 400, err);
      }

      return await chainProvider.sweep(coin, addresses);
    },
    throttle('Sweep', 5_000),
  );
