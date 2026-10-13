import {beforeEach, expect, mock, test} from 'bun:test';
import {Elysia} from 'elysia';
import type {ReservedSql} from 'postgres';

process.env.TROCADOR_API_KEY = 'synthetic-wallet-provider-key';

const identity = {id: 'a'.repeat(12)};
const locks: string[] = [];
const requestID = '00000000-0000-4000-8000-000000000001';
const trade = {
  tradeID: 'synthetic-trade',
  coinFrom: 'btc',
  coinTo: 'ltc',
  amount: 1,
  destinationAddress: 'synthetic-destination',
  refundAddress: 'synthetic-refund',
  provider: 'synthetic',
  isFixed: false,
};
let ownerActive = true;
let identityActive = true;
let providerCalls = 0;
let saved: {id: number; request_id: string; identity_id: string; status: string; request: Record<string, unknown>; response: unknown} | undefined;

const connection = Object.assign(
  async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.join(' ').replace(/\s+/g, ' ');

    if (query.includes('SELECT id FROM users')) {
      return ownerActive ? [{id: 71}] : [];
    }

    if (query.includes('SELECT id FROM identities')) {
      return identityActive ? [{id: identity.id}] : [];
    }

    if (query.includes('pg_advisory_xact_lock')) {
      return [];
    }

    if (query.includes('SELECT request_id FROM wallet_swaps')) {
      return saved && saved.status !== 'completed' && saved.request_id !== values[2] ? [{request_id: saved.request_id}] : [];
    }

    if (query.includes('INSERT INTO wallet_swaps')) {
      saved ??= {
        id: 1,
        request_id: String(values[1]),
        identity_id: String(values[2]),
        status: 'pending',
        request: values[3] as Record<string, unknown>,
        response: null,
      };

      return [];
    }

    if (query.includes('SELECT * FROM wallet_swaps')) {
      return saved ? [saved] : [];
    }

    if (query.includes("UPDATE wallet_swaps SET status = 'requested'")) {
      if (saved?.status !== 'pending') {
        return [];
      }

      saved.status = 'requested';

      return [{id: saved.id}];
    }

    throw new Error(`Unexpected synthetic database query: ${query}`);
  },
  {
    json: (value: unknown) => value,
    begin: async (operation: (database: ReservedSql) => Promise<unknown>): Promise<unknown> => operation(connection as unknown as ReservedSql),
  },
);

mock.module('../src/core/services', () => ({sql: connection}));
mock.module('../src/middlewares/middleware-api', () => ({default: (app: Elysia) => app.derive(() => ({user: {accountID: 71}, identity}))}));
mock.module('../src/core/identity-service', () => ({
  withAccountLock: async (owner: number, operation: (database: ReservedSql) => Promise<unknown>) => {
    locks.push(`account:${owner}`);

    return operation(connection as unknown as ReservedSql);
  },
  withIdentityLock: async (id: string, operation: (database: ReservedSql) => Promise<unknown>) => {
    locks.push(`identity:${id}`);

    return operation(connection as unknown as ReservedSql);
  },
}));
mock.module('../src/core/swap-provider', () => ({
  swapProvider: {
    trade: async () => {
      providerCalls++;
      throw new Error('synthetic interrupted provider trade');
    },
  },
}));

const {ApiError} = await import('../src/core/security');
const {default: walletRoutes} = await import('../src/routes/public-api/api-crypto');
const app = new Elysia()
  .onError(({error, set}) => {
    set.status = error instanceof ApiError ? error.status : 503;

    return {error: {message: error instanceof Error ? error.message : 'Synthetic provider failure'}};
  })
  .use(walletRoutes);

function create(id = requestID) {
  return app.handle(
    new Request(`http://localhost/api/identities/${identity.id}/wallet/swaps`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...trade, requestID: id}),
    }),
  );
}

beforeEach(() => {
  ownerActive = true;
  identityActive = true;
  providerCalls = 0;
  saved = undefined;
  locks.length = 0;
});

test('retains an interrupted provider request and blocks blind retries under account then identity locks', async () => {
  expect((await create()).status).toBe(503);
  expect(saved?.status).toBe('requested');
  expect(saved?.request).toEqual(trade);
  expect((await create()).status).toBe(503);
  expect(providerCalls).toBe(1);
  expect(locks.slice(0, 2)).toEqual(['account:71', `identity:${identity.id}`]);
  expect((await create('00000000-0000-4000-8000-000000000002')).status).toBe(409);
  expect(providerCalls).toBe(1);
});

test('rechecks account deletion inside the acquired locks before creating an external trade', async () => {
  ownerActive = false;

  expect((await create()).status).toBe(409);
  expect(providerCalls).toBe(0);
  expect(saved).toBeUndefined();
});

test('rechecks active identity ownership inside the acquired locks before creating an external trade', async () => {
  identityActive = false;

  expect((await create()).status).toBe(409);
  expect(providerCalls).toBe(0);
  expect(saved).toBeUndefined();
});
