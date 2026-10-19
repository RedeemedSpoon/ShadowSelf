import {afterAll, beforeAll, beforeEach, describe, expect, test} from 'bun:test';
import type Stripe from 'stripe';

const databaseURL = process.env.SHADOWSELF_TEST_DATABASE_URL;
let sql: typeof import('../src/core/services').sql;
let deleteAccount: typeof import('../src/core/identity-service').deleteAccount;
let deleteIdentity: typeof import('../src/core/identity-service').deleteIdentity;
let processStripeEvent: typeof import('../src/core/stripe-service').processStripeEvent;
let app: ReturnType<typeof import('../src/app').createApp>;
let owner: number;

const identityID = 'abc123def456';
const provider = {
  subscriptions: {
    retrieve: async () => ({id: 'sub_synthetic', status: 'canceled'}),
  },
  customers: {del: async () => ({deleted: true})},
  paymentIntents: {
    retrieve: async () => ({
      id: 'pi_synthetic',
      status: 'succeeded',
      currency: 'usd',
      amount_received: 19999,
      metadata: {id: identityID, type: 'lifetime'},
      customer: 'cus_synthetic',
      created: Math.floor(Date.now() / 1000),
    }),
  },
} as unknown as Stripe;

describe.skipIf(!databaseURL)('immediate deletion with an isolated database', () => {
  beforeAll(async () => {
    const url = new URL(databaseURL!);

    if (!/^\/shadowself(?:_test(?:_[a-z0-9_]+)?|_[a-z0-9_]+_test)$/.test(url.pathname)) {
      throw new Error('SHADOWSELF_TEST_DATABASE_URL must name a disposable ShadowSelf test database');
    }

    process.env.NODE_ENV = 'test';
    process.env.POSTGRES_HOST = url.hostname;
    process.env.POSTGRES_PORT = url.port || '5432';
    process.env.POSTGRES_DB = url.pathname.slice(1);
    process.env.APP_DB_USER = decodeURIComponent(url.username);
    process.env.APP_DB_PASSWORD = decodeURIComponent(url.password) || 'synthetic';
    process.env.SECRET_SAUCE = 'synthetic-cleanup-test-secret-only';

    ({sql} = await import('../src/core/services'));
    ({deleteIdentity, deleteAccount} = await import('../src/core/identity-service'));
    ({processStripeEvent} = await import('../src/core/stripe-service'));
    app = (await import('../src/app')).createApp();

    const schema = await Bun.file(new URL('../../database/schemas.sql', import.meta.url)).text();
    await sql.unsafe(schema);
  });

  beforeEach(async () => {
    await sql`TRUNCATE users, sessions, wallet_swaps, crypto_invoices, identities, accounts, creation_jobs, fiat_intents, stripe_events, invoice_observations RESTART IDENTITY CASCADE`;
    const users =
      await sql`INSERT INTO users (username, password, email, stripe_customer) VALUES ('Fixture', 'synthetic-hash', 'fixture@example.test', 'cus_synthetic') RETURNING id`;
    owner = users[0].id;
    await sql`INSERT INTO identities (id, owner, creation_date) VALUES (${identityID}, ${owner}, NOW() - INTERVAL '30 days')`;
    await sql`INSERT INTO accounts (owner, username, password) VALUES (${identityID}, 'Fixture', 'encrypted-fixture')`;
    await sql`INSERT INTO creation_jobs (identity_id) VALUES (${identityID})`;
    await sql`INSERT INTO fiat_intents (owner, plan, identity_id, request_id) VALUES (${owner}, 'lifetime', ${identityID}, ${crypto.randomUUID()})`;
  });

  afterAll(async () => {
    await sql?.end({timeout: 1});
  });

  test('deletion removes the identity, vault, creation draft, and purchase authorization', async () => {
    await deleteIdentity(identityID, owner, provider);

    expect(await sql`SELECT id FROM identities WHERE id = ${identityID}`).toHaveLength(0);
    expect(await sql`SELECT id FROM accounts WHERE owner = ${identityID}`).toHaveLength(0);
    expect(await sql`SELECT id FROM creation_jobs WHERE identity_id = ${identityID}`).toHaveLength(0);
    expect(await sql`SELECT id FROM fiat_intents WHERE identity_id = ${identityID}`).toHaveLength(0);
    expect(await sql`SELECT id FROM users WHERE id = ${owner}`).toHaveLength(1);
  });

  test('provider failure retains the identity so deletion can be retried', async () => {
    await sql`UPDATE identities SET subscription_id = 'sub_synthetic' WHERE id = ${identityID}`;
    const failing = {
      subscriptions: {
        retrieve: async () => {
          throw new Error('synthetic outage');
        },
      },
    } as unknown as Stripe;

    await expect(deleteIdentity(identityID, owner, failing)).rejects.toThrow('synthetic outage');
    expect(await sql`SELECT id FROM identities WHERE id = ${identityID}`).toHaveLength(1);

    await deleteIdentity(identityID, owner, provider);
    expect(await sql`SELECT id FROM identities WHERE id = ${identityID}`).toHaveLength(0);
  });

  test('an ownership mismatch cannot delete another account identity', async () => {
    await deleteIdentity(identityID, owner + 1, provider);

    expect(await sql`SELECT id FROM identities WHERE id = ${identityID}`).toHaveLength(1);
  });

  test('late payment events cannot recreate a deleted identity', async () => {
    await deleteIdentity(identityID, owner, provider);
    const event = {type: 'payment_intent.succeeded', data: {object: {id: 'pi_synthetic'}}};
    await sql`INSERT INTO stripe_events (id, payload) VALUES ('evt_synthetic', ${sql.json(event)})`;

    await processStripeEvent('evt_synthetic', provider);

    expect(await sql`SELECT id FROM identities WHERE id = ${identityID}`).toHaveLength(0);
  });

  test('account deletion removes sessions and prevents subsequent authentication', async () => {
    const {issueSession, verifySessionToken} = await import('../src/middlewares/session-auth');
    const token = await issueSession('fixture@example.test');

    expect(await verifySessionToken(token)).toBeDefined();

    await deleteAccount(owner, provider);

    expect(await sql`SELECT id FROM users WHERE id = ${owner}`).toHaveLength(0);
    expect(await sql`SELECT id FROM identities WHERE owner = ${owner}`).toHaveLength(0);
    expect(await sql`SELECT id FROM sessions WHERE owner = ${owner}`).toHaveLength(0);
    expect(await verifySessionToken(token)).toBeUndefined();
  });

  test('unconfigured providers block purchases before any billing work', async () => {
    const {issueSession} = await import('../src/middlewares/session-auth');
    const token = await issueSession('fixture@example.test');

    for (const path of ['/api/billing/checkout', '/api/billing/crypto/invoices']) {
      const response = await app.handle(
        new Request(`http://localhost${path}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', authorization: `Bearer ${token}`},
          body: JSON.stringify({plan: 'monthly', requestID: crypto.randomUUID()}),
        }),
      );

      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe('provider_unavailable');
    }
  });

  test('authentication guards reject protected routes with the same error shape', async () => {
    for (const [method, path] of [
      ['GET', '/api/auth/session'],
      ['GET', '/api/settings'],
      ['POST', '/api/billing/checkout'],
      ['POST', '/api/billing/crypto/invoices'],
      ['DELETE', `/api/identities/${identityID}`],
    ]) {
      const response = await app.handle(
        new Request(`http://localhost${path}`, {
          method,
          ...(method === 'POST' ? {headers: {'Content-Type': 'application/json'}, body: '{}'} : {}),
        }),
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({error: {code: 'unauthenticated', message: 'Sign in to continue'}});
    }
  });
});
