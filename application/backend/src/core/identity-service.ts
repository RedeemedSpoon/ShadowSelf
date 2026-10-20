import {ApiError} from '@core/security';
import {queueCryptoRefund, validateRefundAddress} from '@core/crypto-refunds';
import {REFUND_WINDOW_MS} from '@core/constants';
import {withReservedTransaction} from '@utils/utils';
import {sql} from '@core/services';
import type {ReservedSql, TransactionSql} from 'postgres';

export async function withIdentityLock<T>(
  id: string,
  operation: (connection: ReservedSql) => Promise<T>,
  existing?: ReservedSql,
) {
  return withResourceLock(id, operation, existing);
}

export async function withAccountLock<T>(
  owner: number,
  operation: (connection: ReservedSql) => Promise<T>,
  existing?: ReservedSql,
) {
  return withResourceLock(`account:${owner}`, operation, existing);
}

async function withResourceLock<T>(
  id: string,
  operation: (connection: ReservedSql) => Promise<T>,
  existing?: ReservedSql,
) {
  const connection = existing || (await sql.reserve());

  let locked = false;

  try {
    const lock = await connection`SELECT pg_try_advisory_lock(hashtextextended(${id}, 0)) AS acquired`;
    locked = lock[0].acquired;

    if (!locked) {
      throw new ApiError(409, 'operation_busy', 'This operation is already running. Retry shortly');
    }

    return await operation(connection);
  } finally {
    try {
      if (locked) {
        await connection`SELECT pg_advisory_unlock(hashtextextended(${id}, 0))`;
      }
    } finally {
      if (!existing) {
        connection.release();
      }
    }
  }
}

export async function provisionIdentity(id: string) {
  const identities = await sql`SELECT status FROM identities WHERE id = ${id}`;

  if (!identities.length) {
    throw new ApiError(404, 'identity_not_found', 'Identity not found');
  }

  if (identities[0].status === 'active') {
    return;
  }

  throw new ApiError(
    503,
    'provider_unavailable',
    'Identity provisioning is unavailable until phone and network providers are configured',
  );
}

export async function deleteIdentity(id: string, owner: number, refundAddress?: unknown) {
  const address = await validateRefundAddress(refundAddress);

  return withAccountLock(owner, async (connection) => {
    await withReservedTransaction(connection, async (transaction) => {
      await transaction`SELECT id FROM users WHERE id = ${owner} FOR UPDATE`;
      await removeIdentityRecords(id, owner, transaction, address);
    });
  });
}

export async function removeIdentityRecords(
  id: string,
  owner: number,
  transaction: ReservedSql | TransactionSql,
  refundAddress?: string,
) {
  await queueCryptoRefund(id, owner, refundAddress, transaction);
  await queueIdentityBilling(id, owner, transaction);
  await transaction`UPDATE crypto_invoices SET owner = NULL, identity_id = NULL, xmr_subaddress = NULL,
    refund_address = NULL, provider_reference = NULL, provider_state = NULL, response = NULL
    WHERE identity_id = ${id} AND owner = ${owner} AND status = 'paid'`;
  await transaction`DELETE FROM fiat_intents WHERE identity_id = ${id} AND owner = ${owner}`;
  await transaction`DELETE FROM wallet_swaps WHERE identity_id = ${id} AND owner = ${owner}`;
  await transaction`DELETE FROM identities WHERE id = ${id} AND owner = ${owner}`;
}

async function queueIdentityBilling(id: string, owner: number, transaction: ReservedSql | TransactionSql) {
  const identities =
    await transaction`SELECT i.subscription_id, i.payment_intent, i.creation_date, u.stripe_customer, f.provider_id FROM identities i
    JOIN users u ON u.id = i.owner LEFT JOIN fiat_intents f ON f.identity_id = i.id AND f.owner = i.owner
    WHERE i.id = ${id} AND i.owner = ${owner}`;
  const identity = identities[0];

  if (!identity || (!identity.subscription_id && !identity.payment_intent)) {
    return;
  }

  if (!identity.stripe_customer) {
    throw new ApiError(503, 'billing_reference_missing', 'Billing details need reconciliation before deletion');
  }

  const age = Date.now() - new Date(identity.creation_date).getTime();

  await transaction`INSERT INTO stripe_cleanup (customer_id, subscription_id, payment_intent, refund_requested)
    VALUES (${identity.stripe_customer}, ${identity.subscription_id}, ${identity.payment_intent || identity.provider_id || null},
      ${age >= 0 && age <= REFUND_WINDOW_MS}) ON CONFLICT DO NOTHING`;
}

export async function deleteAccount(owner: number, refundAddress?: unknown) {
  const address = await validateRefundAddress(refundAddress);

  return withAccountLock(owner, async (connection) => {
    await withReservedTransaction(connection, async (transaction) => {
      const accounts = await transaction`SELECT stripe_customer FROM users WHERE id = ${owner} FOR UPDATE`;

      if (!accounts.length) {
        return;
      }

      const identities = await transaction`SELECT id FROM identities WHERE owner = ${owner}`;

      for (const identity of identities) {
        await removeIdentityRecords(identity.id, owner, transaction, address);
      }

      const customer = accounts[0].stripe_customer;

      if (customer) {
        await transaction`INSERT INTO stripe_cleanup (customer_id, checkout_reference, subscription_id, payment_intent, refund_requested)
          SELECT ${customer}, CASE WHEN f.subscription_id IS NULL AND f.provider_id IS NULL THEN f.identity_id END,
            f.subscription_id, f.provider_id, true FROM fiat_intents f
          WHERE f.owner = ${owner} AND (f.subscription_id IS NOT NULL OR f.provider_id IS NOT NULL
            OR f.response IS NULL)
          AND NOT EXISTS (SELECT 1 FROM identities i WHERE i.id = f.identity_id AND i.owner = ${owner})
          ON CONFLICT DO NOTHING`;
        await transaction`INSERT INTO stripe_cleanup (customer_id) VALUES (${customer}) ON CONFLICT DO NOTHING`;
      }

      await transaction`DELETE FROM users WHERE id = ${owner}`;
    });
  });
}
