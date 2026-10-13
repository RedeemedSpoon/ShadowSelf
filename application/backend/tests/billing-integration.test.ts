import {afterAll, beforeAll, beforeEach, describe, expect, test} from 'bun:test';
import postgres from 'postgres';
import {activateInvoice, processInvoiceBatch, pollInvoices} from '@core/background-workers';
import {completeAccountDeletion, withAccountLock} from '@core/identity-service';
import type {QueryInvoice} from '@type';
import type Stripe from 'stripe';
import type {watchWallet} from '@core/states';
import {INVOICE_POLL_BATCH_SIZE} from '@core/constants';

const databaseUrl = process.env.SHADOWSELF_TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const database = databaseUrl ? postgres(databaseUrl, {max: 4, connect_timeout: 2, onnotice: () => {}}) : undefined;

suite('isolated billing database', () => {
  beforeAll(async () => {
    const target = new URL(databaseUrl!);

    if (!target.pathname.endsWith('_test') || !['localhost', '127.0.0.1', 'postgres'].includes(target.hostname)) {
      throw new Error('Billing integration tests require a local database ending in _test');
    }

    await database!.unsafe(await Bun.file(new URL('../../database/schemas.sql', import.meta.url)).text());
  });

  beforeEach(async () => {
    await database!`TRUNCATE users CASCADE`;
  });

  afterAll(async () => {
    await database!.end({timeout: 2});
  });

  async function account() {
    const rows = await database!`INSERT INTO users (username, password, email)
      VALUES ('Synthetic', 'synthetic-hash', 'synthetic@example.test') RETURNING id`;

    return rows[0].id as number;
  }

  async function invoice(owner: number | null) {
    const rows = await database!`INSERT INTO crypto_invoices (owner, plan, xmr_amount, request_id, swap_coin)
      VALUES (${owner}, 'monthly', '0.1', ${crypto.randomUUID()}, 'xmr') RETURNING *`;

    return rows[0] as QueryInvoice;
  }

  test('an ownerless paid invoice is retained and a following valid invoice still activates', async () => {
    const ownerless = await invoice(null);
    const valid = await invoice(await account());
    const connection = await database!.reserve();

    try {
      const result = await processInvoiceBatch([ownerless, valid], async (entry) => {
        await activateInvoice(connection, entry);
      });
      const invoices = await database!`SELECT id, owner, status FROM crypto_invoices ORDER BY owner NULLS FIRST`;
      const identities = await database!`SELECT owner, crypto_invoice FROM identities`;

      expect(result).toEqual({processed: 2, failed: 0});
      expect(invoices[0]).toMatchObject({id: ownerless.id, owner: null, status: 'reconciliation'});
      expect(invoices[1]).toMatchObject({id: valid.id, status: 'paid'});
      expect(identities).toHaveLength(1);
      expect(identities[0]).toMatchObject({owner: valid.owner, crypto_invoice: valid.id});
    } finally {
      connection.release();
    }
  });

  test('an invoice failure rolls back its transaction and does not interrupt later invoices', async () => {
    const invalid = {...(await invoice(await account())), plan: 'invalid-plan'} as unknown as QueryInvoice;
    const valid = await invoice(invalid.owner);
    const connection = await database!.reserve();

    try {
      const result = await processInvoiceBatch([invalid, valid], async (entry) => {
        await activateInvoice(connection, entry);
      });
      const failed = await database!`SELECT status FROM crypto_invoices WHERE id = ${invalid.id}`;
      const paid = await database!`SELECT status FROM crypto_invoices WHERE id = ${valid.id}`;

      expect(result).toEqual({processed: 2, failed: 1});
      expect(failed[0].status).toBe('pending');
      expect(paid[0].status).toBe('paid');
    } finally {
      connection.release();
    }
  });

  test('activation is idempotent and deletion requests prevent new identities', async () => {
    const owner = await account();
    const paid = await invoice(owner);
    const connection = await database!.reserve();

    try {
      const first = await activateInvoice(connection, paid);
      const second = await activateInvoice(connection, paid);
      await database!`UPDATE users SET deletion_requested_at = NOW() WHERE id = ${owner}`;
      const blocked = await invoice(owner);

      expect(first).toBeTruthy();
      expect(second).toBe(first);
      expect(await activateInvoice(connection, blocked)).toBeNull();
      expect(await database!`SELECT id FROM identities`).toHaveLength(1);
    } finally {
      connection.release();
    }
  });

  test('pending cleanup retains the account and finishes automatically after resources are removed', async () => {
    const owner = await account();
    const financial = await invoice(owner);
    await database!`UPDATE users SET deletion_requested_at = NOW(), stripe_customer = 'cus_synthetic' WHERE id = ${owner}`;
    await database!`INSERT INTO identities (id, owner, creation_date) VALUES ('synthetic-id', ${owner}, NOW())`;
    const customers: string[] = [];
    const provider = {
      customers: {
        del: async (id: string) => {
          customers.push(id);
        },
      },
    } as unknown as Stripe;

    expect(await completeAccountDeletion(owner, provider, database!, async () => false)).toBe(false);
    expect(await database!`SELECT id FROM users WHERE id = ${owner}`).toHaveLength(1);
    expect(customers).toHaveLength(0);

    const completed = await completeAccountDeletion(owner, provider, database!, async (id) => {
      await database!`DELETE FROM identities WHERE id = ${id}`;

      return true;
    });
    const retained = await database!`SELECT owner FROM crypto_invoices WHERE id = ${financial.id}`;

    expect(completed).toBe(true);
    expect(customers).toEqual(['cus_synthetic']);
    expect(await database!`SELECT id FROM users WHERE id = ${owner}`).toHaveLength(0);
    expect(retained[0].owner).toBeNull();
  });

  test('bounded polling rotates through active and archived invoices without unchanged observations', async () => {
    await database!`INSERT INTO crypto_invoices (owner, plan, xmr_amount, request_id, swap_coin, xmr_subaddress, creation_date)
      SELECT NULL, 'monthly', '0.1', gen_random_uuid(), 'xmr', 'synthetic-' || series,
        CASE WHEN series <= 125 THEN NOW() ELSE NOW() - INTERVAL '30 days' END
      FROM generate_series(1, 185) AS series`;
    const wallet = {
      sync: async () => {},
      getHeight: async () => 50,
      getAddressIndex: async () => ({getAccountIndex: () => 0, getIndex: () => 0}),
      getBalance: async () => 0n,
      getUnlockedBalance: async () => 0n,
    } as unknown as typeof watchWallet;
    const connection = await database!.reserve();

    try {
      for (let pass = 0; pass < 3; pass++) {
        const result = await pollInvoices(connection, wallet);

        expect(result!.processed).toBeLessThanOrEqual(INVOICE_POLL_BATCH_SIZE);
        expect(result!.archived).toBeLessThanOrEqual(INVOICE_POLL_BATCH_SIZE / 4);
        expect(result!.failed).toBe(0);
      }

      const observations = await database!`SELECT COUNT(*)::integer AS count FROM invoice_observations`;

      expect(observations[0].count).toBe(185);
    } finally {
      connection.release();
    }
  });

  test('account creation and deletion locks exclude each other without occupying extra connections', async () => {
    const owner = await account();
    const first = await database!.reserve();
    const second = await database!.reserve();
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const running = withAccountLock(
      owner,
      async () => {
        started.resolve();
        await release.promise;
      },
      first,
    );

    try {
      await started.promise;
      await expect(withAccountLock(owner, async () => {}, second)).rejects.toThrow('already running');
      release.resolve();
      await running;
      await withAccountLock(
        owner,
        async (connection) => {
          await connection`UPDATE users SET deletion_requested_at = NOW() WHERE id = ${owner}`;
        },
        second,
      );

      const accounts = await database!`SELECT deletion_requested_at FROM users WHERE id = ${owner}`;

      expect(accounts[0].deletion_requested_at).toBeTruthy();
    } finally {
      release.resolve();
      await running;
      first.release();
      second.release();
    }
  });
});
