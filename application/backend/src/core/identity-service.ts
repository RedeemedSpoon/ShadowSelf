import {generateProxyPassword} from '@utils/cryptography';
import {origin, twilioConfig} from '@core/config';
import {proxyRequest} from '@utils/utils';
import type {IdentityProvision} from '@type';
import {LOCATIONS} from '@core/constants';
import {sql, twilio, stripe} from '@core/services';
import {randomBytes} from 'node:crypto';

export async function provisionIdentity(id: string, jobID: string, data: IdentityProvision) {
  const connection = await sql.reserve();

  try {
    await connection`SELECT pg_advisory_lock(hashtextextended(${id}, 0))`;
    const rows = await connection`SELECT * FROM identities WHERE id = ${id}`;
    if (!rows[0]) throw new Error('Identity not found');
    if (rows[0].status === 'active') return;
    if (rows[0].status !== 'inactive') throw new Error('Identity is not available for creation');

    if (rows[0].phone && rows[0].phone !== data.phone) throw new Error('Retry with the reserved phone number');
    if (rows[0].email && rows[0].email !== data.email) throw new Error('Retry with the reserved email address');

    const location = LOCATIONS.find((location) => location.code === data.location)!;
    const proxyPassword = rows[0].proxy_password || generateProxyPassword();
    const emailPassword = rows[0].email_password || randomBytes(24).toString('base64url');
    const existing = await connection`SELECT id FROM identities WHERE (email = ${data.email} OR phone = ${data.phone}) AND id <> ${id}`;
    if (existing.length) throw new Error('These resources already belong to another identity');

    await connection`UPDATE identities SET location = ${`${location.code}, ${location.city}, ${location.country}`}, proxy_server = ${location.ip},
      proxy_password = ${proxyPassword}, email = ${data.email}, email_password = ${emailPassword}, phone = ${data.phone},
      picture = ${data.picture}, name = ${data.name}, bio = ${data.bio}, age = ${data.age}, sex = ${data.sex}, ethnicity = ${data.ethnicity},
      wallet_blob = ${data.wallet.blob}, wallet_keys = ${connection.json({...data.wallet.keys})} WHERE id = ${id}`;

    await proxyRequest(location.code.toLowerCase(), 'POST', {username: id, password: proxyPassword});
    const phones = await twilio.incomingPhoneNumbers.list({phoneNumber: data.phone, limit: 1});
    const phone =
      phones[0] ?? (await twilio.incomingPhoneNumbers.create({emergencyStatus: 'Inactive', smsUrl: `${origin}/webhook-twilio`, phoneNumber: data.phone}));
    await connection`UPDATE identities SET phone_sid = ${phone.sid} WHERE id = ${id}`;

    const service = twilio.messaging.v1.services(twilioConfig.messagingService!);
    const members = await service.phoneNumbers.list();
    if (!members.some((member) => member.sid === phone.sid)) await service.phoneNumbers.create({phoneNumberSid: phone.sid});

    await connection.begin(async (transaction) => {
      await transaction`UPDATE identities SET status = 'active' WHERE id = ${id}`;
      await transaction`UPDATE creation_jobs SET status = 'completed', payload = '[]'::jsonb WHERE id = ${jobID}`;
    });
  } finally {
    await connection`SELECT pg_advisory_unlock(hashtextextended(${id}, 0))`;
    connection.release();
  }
}

export async function deleteIdentity(id: string, owner: number) {
  const connection = await sql.reserve();

  try {
    await connection`SELECT pg_advisory_lock(hashtextextended(${id}, 0))`;
    const identities = await connection`SELECT * FROM identities WHERE id = ${id} AND owner = ${owner}`;
    const identity = identities[0];
    if (!identity) return true;

    await connection`INSERT INTO identity_deletions (identity_id, owner, email) VALUES (${id}, ${owner}, ${identity.email}) ON CONFLICT DO NOTHING`;
    await connection`UPDATE identities SET status = 'deleting' WHERE id = ${id}`;

    const jobs = await connection`SELECT * FROM identity_deletions WHERE identity_id = ${id}`;
    if (!jobs[0].billing_done) {
      await cancelIdentityBilling(identity);
      await connection`UPDATE identity_deletions SET billing_done = true WHERE identity_id = ${id}`;
    }

    if (identity.phone) {
      const numbers = await twilio.incomingPhoneNumbers.list({phoneNumber: identity.phone, limit: 1});
      for (const number of numbers) await twilio.incomingPhoneNumbers(number.sid).remove();
    }

    if (identity.location) await proxyRequest(identity.location.split(',')[0].toLowerCase(), 'DELETE', {username: id});
    if (identity.email && !jobs[0].mail_done) return false;

    await connection.begin(async (transaction) => {
      await transaction`DELETE FROM accounts WHERE owner = ${id}`;
      await transaction`DELETE FROM identities WHERE id = ${id}`;
      await transaction`UPDATE identity_deletions SET completed_at = NOW(), email = NULL WHERE identity_id = ${id}`;
    });

    return true;
  } finally {
    await connection`SELECT pg_advisory_unlock(hashtextextended(${id}, 0))`;
    connection.release();
  }
}

async function cancelIdentityBilling(identity: Record<string, any>) {
  if (identity.subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(identity.subscription_id);
    if (subscription.status !== 'canceled') await stripe.subscriptions.cancel(subscription.id, {}, {idempotencyKey: `cancel:${identity.id}`});
  }

  if (Date.now() - new Date(identity.creation_date).getTime() > 14 * 86_400_000) return;
  let intent = identity.payment_intent;
  if (!intent && identity.subscription_id) {
    const invoices = await stripe.invoices.list({subscription: identity.subscription_id, limit: 1});
    if (invoices.data[0]) {
      const payments = await stripe.invoicePayments.list({invoice: invoices.data[0].id, limit: 1});
      const reference = payments.data[0]?.payment.payment_intent;
      intent = typeof reference === 'string' ? reference : reference?.id;
    }
  }

  if (intent) {
    const refunds = await stripe.refunds.list({payment_intent: intent, limit: 100});
    if (!refunds.data.some((refund) => refund.status !== 'failed' && refund.status !== 'canceled')) {
      await stripe.refunds.create({payment_intent: intent}, {idempotencyKey: `refund:${identity.id}:${intent}`});
    }
  }
}
