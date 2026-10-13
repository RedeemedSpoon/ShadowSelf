import {ApiError, encryptSecret, decryptSecret} from '@core/security';
import {createHash} from 'node:crypto';
import {phoneProvider} from '@core/phone-provider';
import {withReservedTransaction} from '@utils/utils';
import type {CreationDraft, IdentityProvision} from '@type';
import type {ReservedSql} from 'postgres';
import {emailConfig} from '@core/config';
import {checkIdentity} from '@utils/checks';
import {LOCATIONS} from '@core/constants';
import {sql, stripe} from '@core/services';
import {randomBytes} from 'node:crypto';
import type Stripe from 'stripe';

export async function withIdentityLock<T>(id: string, operation: (connection: ReservedSql) => Promise<T>) {
  const connection = await sql.reserve();

  let locked = false;

  try {
    const lock = await connection`SELECT pg_try_advisory_lock(hashtextextended(${id}, 0)) AS acquired`;
    locked = lock[0].acquired;

    if (!locked) {
      throw new ApiError(409, 'creation_busy', 'This identity operation is already running');
    }

    return await operation(connection);
  } finally {
    try {
      if (locked) {
        await connection`SELECT pg_advisory_unlock(hashtextextended(${id}, 0))`;
      }
    } finally {
      connection.release();
    }
  }
}

export async function provisionIdentity(id: string) {
  return withIdentityLock(id, async (connection) => {
    const rows = await connection`SELECT * FROM identities WHERE id = ${id}`;

    if (!rows[0]) {
      throw new ApiError(404, 'identity_not_found', 'Identity not found');
    }

    if (rows[0].status === 'active') {
      return;
    }

    if (rows[0].status !== 'inactive') {
      throw new ApiError(409, 'creation_unavailable', 'Identity is not available for creation');
    }

    const jobs = await connection`SELECT id, payload FROM creation_jobs WHERE identity_id = ${id}`;

    const draft = jobs[0]?.payload as CreationDraft | undefined;
    const input = {...draft?.profile, location: draft?.location, email: draft?.email, phone: draft?.phone, wallet: draft?.wallet};
    const validation = await checkIdentity('provision', input);

    if (validation.error) {
      throw new ApiError(400, 'invalid_request', validation.error);
    }

    if (!emailConfig.host) {
      throw new ApiError(503, 'provider_unavailable', 'Email provisioning is unavailable');
    }

    const data = input as IdentityProvision;

    if (rows[0].phone && rows[0].phone !== data.phone) {
      throw new Error('Retry with the reserved phone number');
    }

    if (rows[0].email && rows[0].email !== data.email) {
      throw new Error('Retry with the reserved email address');
    }

    const location = LOCATIONS.find((location) => location.code === data.location)!;
    const emailPassword = rows[0].email_password ? decryptSecret(rows[0].email_password) : randomBytes(24).toString('base64url');
    const existing = await connection`SELECT id FROM identities WHERE (email = ${data.email} OR phone = ${data.phone}) AND id <> ${id}`;

    if (existing.length) {
      throw new Error('These resources already belong to another identity');
    }

    await withReservedTransaction(connection, async (transaction) => {
      await transaction`UPDATE creation_jobs SET status = 'provisioning' WHERE id = ${jobs[0].id}`;
      await transaction`UPDATE identities SET location = ${`${location.code}, ${location.city}, ${location.country}`},
      email = ${data.email}, email_password = ${encryptSecret(emailPassword)}, email_password_hash = ${createHash('sha256').update(emailPassword).digest('base64')}, phone = ${data.phone},
      picture = ${data.picture}, name = ${data.name}, bio = ${data.bio}, age = ${data.age}, sex = ${data.sex}, ethnicity = ${data.ethnicity},
      wallet_blob = ${data.wallet.blob}, wallet_keys = ${transaction.json({...data.wallet.keys})} WHERE id = ${id}`;
    });

    const phoneSID = await phoneProvider.provision(data.phone, id);
    await connection`UPDATE identities SET phone_sid = ${phoneSID} WHERE id = ${id}`;

    await withReservedTransaction(connection, async (transaction) => {
      await transaction`UPDATE identities SET status = 'active' WHERE id = ${id}`;
      await transaction`UPDATE creation_jobs SET status = 'completed', payload = '{}'::jsonb WHERE id = ${jobs[0].id}`;
    });
  });
}

export async function deleteIdentity(id: string, owner: number, provider: Stripe = stripe) {
  const connection = await sql.reserve();

  let locked = false;

  try {
    const lock = await connection`SELECT pg_try_advisory_lock(hashtextextended(${id}, 0)) AS acquired`;
    locked = lock[0].acquired;

    if (!locked) {
      throw new Error('This identity operation is already running');
    }

    const identities = await connection`SELECT * FROM identities WHERE id = ${id} AND owner = ${owner}`;

    const identity = identities[0];

    if (!identity) {
      return true;
    }

    await connection`INSERT INTO identity_deletions (identity_id, owner, email) VALUES (${id}, ${owner}, ${identity.email}) ON CONFLICT DO NOTHING`;
    await connection`UPDATE identities SET status = 'deleting' WHERE id = ${id}`;

    const jobs = await connection`SELECT * FROM identity_deletions WHERE identity_id = ${id}`;

    if (!jobs[0].billing_done) {
      if (!(await cancelIdentityBilling(identity, new Date(jobs[0].created_at).getTime(), provider))) {
        return false;
      }

      await connection`UPDATE identity_deletions SET billing_done = true WHERE identity_id = ${id}`;
    }

    if (identity.phone) {
      await phoneProvider.release(identity.phone, id, identity.phone_sid || undefined);
    }

    if (identity.email && !jobs[0].mail_done) {
      return false;
    }

    await withReservedTransaction(connection, async (transaction) => {
      await transaction`DELETE FROM accounts WHERE owner = ${id}`;
      await transaction`DELETE FROM identities WHERE id = ${id}`;
      await transaction`UPDATE identity_deletions SET completed_at = NOW(), email = NULL WHERE identity_id = ${id}`;
    });

    return true;
  } finally {
    try {
      if (locked) {
        await connection`SELECT pg_advisory_unlock(hashtextextended(${id}, 0))`;
      }
    } finally {
      connection.release();
    }
  }
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

export async function repairIdentityDeletions() {
  const jobs = await sql`SELECT identity_id, owner FROM identity_deletions WHERE completed_at IS NULL ORDER BY created_at LIMIT 100`;

  for (const job of jobs) {
    try {
      await deleteIdentity(job.identity_id, job.owner);
    } catch {
      console.error('Identity cleanup is pending; ownership records were retained');
    }
  }
}
