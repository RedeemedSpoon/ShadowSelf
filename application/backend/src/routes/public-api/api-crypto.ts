import {cryptoFees, cryptoPrices, billingReadiness, throttle} from '@core/states';
import {POLL_FEES_INTERVAL, POLL_PRICES_INTERVAL, UUID_PATTERN} from '@core/constants';
import {chainProvider} from '@core/chain-provider';
import {withAccountLock, withIdentityLock} from '@core/identity-service';
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
  .get('/', async ({identity, user, request}) => {
    const scope = `${user!.accountID}:${identity!.id}`;
    const outcomes = await chainProvider.overview(scope, identity!.wallet_keys, request.signal);

    const wallet = Object.fromEntries(
      ['btc', 'ltc', 'eth', 'usdt'].map((coin, index) => {
        const result = outcomes[index];

        return [
          coin,
          result.status === 'fulfilled'
            ? result.value
            : {
                status: 'Unavailable',
                balance: null,
                history: [],
                error: `${coin.toUpperCase()} provider is unavailable. Retry to refresh this balance.`,
              },
        ];
      }),
    );
    const prices =
      Date.now() - billingReadiness.priceSync <= POLL_PRICES_INTERVAL * 3
        ? Object.fromEntries(
            Object.entries(cryptoPrices).filter(
              ([, value]) =>
                value &&
                Number.isFinite(value.usdPrice) &&
                value.usdPrice > 0 &&
                Number.isFinite(value.dailyChange) &&
                Array.isArray(value.chart) &&
                value.chart.every(Number.isFinite),
            ),
          )
        : {};
    const fees =
      Date.now() - billingReadiness.feeSync <= POLL_FEES_INTERVAL * 3
        ? Object.fromEntries(
            Object.entries(cryptoFees).filter(
              ([, value]) =>
                value &&
                ['low', 'medium', 'high'].every(
                  (priority) =>
                    Number.isFinite(value[priority as keyof typeof value]) && value[priority as keyof typeof value] > 0,
                ),
            ),
          )
        : {};

    return {prices, fees, wallet};
  })
  .post(
    '/recovery',
    async ({identity, body, request}) => {
      const coin = (body as {coin?: string})?.coin;

      if (coin !== 'btc' && coin !== 'ltc') {
        throw new ApiError(400, 'invalid_coin', 'Choose Bitcoin or Litecoin for an extended discovery scan');
      }

      return {
        coin,
        wallet: await chainProvider.utxo(coin, identity!.wallet_keys[coin], {signal: request.signal, recovery: true}),
      };
    },
    throttle('Wallet recovery', 120_000),
  )
  .post('/prepare', async ({identity, body, request}) => {
    const input = body as {coin?: string; address?: string};

    if (input?.coin !== 'eth' && input?.coin !== 'usdt') {
      throw new ApiError(400, 'invalid_coin', 'Pending state is available for Ethereum and USDT');
    }

    return chainProvider.prepareEvm(input.address ?? identity!.wallet_keys.evm, request.signal);
  })
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
  .get('/swaps', async ({user, identity}) => {
    const rows = await sql`SELECT request_id, status, created_at, request, response FROM wallet_swaps
      WHERE owner = ${user!.accountID} AND identity_id = ${identity!.id}
      ORDER BY (status <> 'completed') DESC, created_at DESC LIMIT 50`;

    return {
      swaps: rows.map((row) => ({
        requestID: row.request_id,
        status: row.status,
        createdAt: row.created_at,
        request: row.request,
        response: row.response,
      })),
    };
  })
  .post(
    '/swaps/:requestID/reconcile',
    async ({params, user, identity}) => {
      if (!UUID_PATTERN.test(params.requestID)) {
        throw new ApiError(400, 'invalid_request', 'A valid request reference is required');
      }

      const rows = await sql`SELECT * FROM wallet_swaps WHERE owner = ${user!.accountID}
      AND identity_id = ${identity!.id} AND request_id = ${params.requestID}`;
      const swap = rows[0];

      if (!swap) {
        throw new ApiError(404, 'swap_not_found', 'Swap request not found');
      }

      if (swap.response) {
        return {status: 'completed', response: swap.response};
      }

      const response = await swapProvider.reconcile(swap.request);

      if (response) {
        await sql`UPDATE wallet_swaps SET response = ${sql.json(response)}, status = 'completed'
        WHERE id = ${swap.id} AND owner = ${user!.accountID} AND identity_id = ${identity!.id}`;
      }

      return {
        status: response ? 'completed' : swap.status,
        response,
        message: response
          ? undefined
          : 'The provider has not confirmed this request. Keep this reference and retry lookup; do not create another trade.',
      };
    },
    throttle('Swap reconciliation', 5_000),
  )
  .post('/swaps', async ({body, set, user, identity}) => {
    const fields = [
      'tradeID',
      'coinTo',
      'coinFrom',
      'amount',
      'destinationAddress',
      'refundAddress',
      'provider',
      'isFixed',
    ];
    const input = await checkAPI(body, fields);

    if (input.err) {
      return error(set, 400, input.err);
    }

    requireProvider(!!trocadorApiKey, 'Crypto exchange');

    const requestID = (body as {requestID?: string})?.requestID;

    if (!UUID_PATTERN.test(requestID || '')) {
      return error(set, 400, 'A request ID is required');
    }

    return withAccountLock(user!.accountID, async () =>
      withIdentityLock(identity!.id, async (connection) => {
        const owners = await connection`SELECT id FROM users WHERE id = ${user!.accountID}`;

        if (!owners.length) {
          throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
        }

        const current =
          await connection`SELECT id FROM identities WHERE id = ${identity!.id} AND owner = ${user!.accountID} AND status = 'active'`;

        if (!current.length) {
          throw new ApiError(409, 'identity_unavailable', 'This identity is no longer active');
        }

        const request = Object.fromEntries(
          fields.map((field) => [field, (input as unknown as Record<string, unknown>)[field]]),
        );
        await connection.begin(async (transaction) => {
          await transaction`SELECT pg_advisory_xact_lock(hashtextextended(${`${user!.accountID}:${identity!.id}:wallet-swaps`}, 0))`;
          const unresolved = await transaction`SELECT request_id FROM wallet_swaps
        WHERE owner = ${user!.accountID} AND identity_id = ${identity!.id}
        AND status <> 'completed' AND request_id <> ${requestID!} LIMIT 1`;

          if (unresolved.length) {
            throw new ApiError(
              409,
              'swap_unresolved',
              `Resolve the existing swap request ${unresolved[0].request_id} before creating another trade`,
            );
          }

          await transaction`INSERT INTO wallet_swaps (owner, request_id, identity_id, request)
        VALUES (${user!.accountID}, ${requestID!}, ${identity!.id}, ${transaction.json(request as never)}) ON CONFLICT (owner, request_id) DO NOTHING`;
        });

        const rows =
          await connection`SELECT * FROM wallet_swaps WHERE owner = ${user!.accountID} AND request_id = ${requestID!}`;

        const swap = rows[0];

        if (swap.identity_id !== identity!.id || fields.some((field) => swap.request[field] !== request[field])) {
          return error(set, 409, 'This request ID has different trade details');
        }

        if (swap.response) {
          return swap.response;
        }

        const claimed =
          await connection`UPDATE wallet_swaps SET status = 'requested' WHERE id = ${swap.id} AND status = 'pending' RETURNING id`;

        if (!claimed.length) {
          return error(
            set,
            503,
            'Trade outcome is uncertain. Review the existing provider trade before another request',
          );
        }

        const response = await swapProvider.trade(input);
        await connection`UPDATE wallet_swaps SET response = ${connection.json(response)}, status = 'completed' WHERE id = ${swap.id}`;

        return response;
      }),
    );
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
