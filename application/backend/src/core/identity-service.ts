import {ApiError} from '@core/security';
import {withReservedTransaction} from '@utils/utils';
import {sql, stripe} from '@core/services';
import type {ReservedSql} from 'postgres';
import type Stripe from 'stripe';

export async function withIdentityLock<T>(id: string, operation: (connection: ReservedSql) => Promise<T>) {
  return withResourceLock(id, operation);
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

export async function deleteIdentity(id: string, owner: number, provider: Stripe = stripe) {
  return withAccountLock(owner, async (connection) => {
    await removeIdentity(id, owner, provider, connection);
  });
}

async function removeIdentity(id: string, owner: number, provider: Stripe, connection: ReservedSql) {
  const identities = await connection`SELECT * FROM identities WHERE id = ${id} AND owner = ${owner}`;
  const identity = identities[0];

  if (!identity) {
    return;
  }

  if (!(await cancelIdentityBilling(identity, Date.now(), provider))) {
    throw new ApiError(503, 'cleanup_incomplete', 'The refund is still processing. Retry deletion after it completes');
  }

  await withReservedTransaction(connection, async (transaction) => {
    await transaction`SELECT id FROM users WHERE id = ${owner} FOR UPDATE`;
    await transaction`DELETE FROM fiat_intents WHERE identity_id = ${id} AND owner = ${owner}`;
    await transaction`DELETE FROM wallet_swaps WHERE identity_id = ${id} AND owner = ${owner}`;
    await transaction`DELETE FROM identities WHERE id = ${id} AND owner = ${owner}`;
  });
}

export async function deleteAccount(owner: number, provider: Stripe = stripe) {
  return withAccountLock(owner, async (connection) => {
    const accounts = await connection`SELECT stripe_customer FROM users WHERE id = ${owner}`;

    if (!accounts.length) {
      return;
    }

    const identities = await connection`SELECT id FROM identities WHERE owner = ${owner}`;

    for (const identity of identities) {
      await removeIdentity(identity.id, owner, provider, connection);
    }

    if (accounts[0].stripe_customer) {
      try {
        await provider.customers.del(accounts[0].stripe_customer);
      } catch (error) {
        if ((error as {code?: string}).code !== 'resource_missing') {
          throw error;
        }
      }
    }

    await withReservedTransaction(connection, async (transaction) => {
      await transaction`SELECT id FROM users WHERE id = ${owner} FOR UPDATE`;
      await transaction`DELETE FROM users WHERE id = ${owner}`;
    });
  });
}

async function cancelIdentityBilling(identity: Record<string, any>, requestedAt: number, provider: Stripe) {
  if (identity.subscription_id) {
    const subscription = await provider.subscriptions.retrieve(identity.subscription_id);

    if (subscription.status !== 'canceled') {
      await provider.subscriptions.cancel(subscription.id, {}, {idempotencyKey: `cancel:${identity.id}`});
    }
  }

  if (requestedAt - new Date(identity.creation_date).getTime() > 14 * 86_400_000) {
    return true;
  }

  let intent = identity.payment_intent;

  if (!intent && identity.subscription_id) {
    const invoices = await provider.invoices.list({subscription: identity.subscription_id, limit: 1});

    if (invoices.data[0]) {
      const payments = await provider.invoicePayments.list({invoice: invoices.data[0].id, limit: 1});

      const reference = payments.data[0]?.payment.payment_intent;
      intent = typeof reference === 'string' ? reference : reference?.id;
    }
  }

  if (!intent) {
    return true;
  }

  const payment = await provider.paymentIntents.retrieve(intent);

  let refunded = 0;
  let failed = 0;

  for await (const refund of provider.refunds.list({payment_intent: intent, limit: 100})) {
    if (refund.status === 'pending' || refund.status === 'requires_action') {
      return false;
    }

    if (refund.status === 'succeeded') {
      refunded += refund.amount;
    } else {
      failed++;
    }
  }

  const remaining = payment.amount_received - refunded;

  if (remaining <= 0) {
    return true;
  }

  const refund = await provider.refunds.create(
    {payment_intent: intent, amount: remaining},
    {idempotencyKey: `refund:${identity.id}:${intent}:${refunded}:${failed}`},
  );

  return refund.status === 'succeeded';
}
