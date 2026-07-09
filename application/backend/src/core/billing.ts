import type {QueryIdentity, QueryUser} from '@type';
import {proxyRequest} from '@utils/utils';
import {sql, stripe, twilio} from '@core/services';
import {$} from 'bun';

type AccountOwner = Pick<QueryUser, 'id' | 'email'>;

async function findIdentity(id: string, owner?: number) {
  const identities =
    owner === undefined
      ? ((await sql`SELECT * FROM identities WHERE id = ${id}`) as QueryIdentity[])
      : ((await sql`SELECT * FROM identities WHERE id = ${id} AND owner = ${owner}`) as QueryIdentity[]);

  return identities[0];
}

async function refundSubscriptionInvoice(subscription: string) {
  const invoices = await stripe.invoices.list({subscription, limit: 1});
  const invoice = invoices.data[0];
  if (!invoice) return;

  const payments = await stripe.invoicePayments.list({invoice: invoice.id, limit: 1});
  const paymentIntent = payments.data[0]?.payment?.payment_intent;
  const paymentIntentID = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;

  if (paymentIntentID) await stripe.refunds.create({payment_intent: paymentIntentID});
}

async function cancelStripeBilling(identity: QueryIdentity) {
  const createdAt = new Date(identity.creation_date).getTime();
  const ageInDays = (Date.now() - createdAt) / (1000 * 3600 * 24);

  try {
    if (ageInDays <= 14) {
      if (identity.payment_intent) await stripe.refunds.create({payment_intent: identity.payment_intent});
      else if (identity.subscription_id) await refundSubscriptionInvoice(identity.subscription_id);
    }

    if (identity.subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(identity.subscription_id);
      if (subscription.status !== 'canceled') await stripe.subscriptions.cancel(identity.subscription_id);
    }
  } catch (_) {}
}

function isMissingTwilioResource(err: unknown) {
  if (!err || typeof err !== 'object') return false;

  const details = err as {status?: number; code?: number};
  return details.status === 404 || details.code === 20404;
}

async function findIncomingPhoneNumberSid(identity: QueryIdentity) {
  if (identity.twilio_phone_sid) return identity.twilio_phone_sid;
  if (!identity.phone) return '';

  const numbers = await twilio.incomingPhoneNumbers.list({phoneNumber: identity.phone, limit: 1});
  return numbers[0]?.sid || '';
}

async function deleteTwilioPhoneNumber(identity: QueryIdentity) {
  const sid = await findIncomingPhoneNumberSid(identity);
  if (!sid) return;

  try {
    await twilio.incomingPhoneNumbers(sid).remove();
  } catch (err) {
    if (!isMissingTwilioResource(err)) throw err;
  }
}

async function deleteIdentityResources(identity: QueryIdentity) {
  if (identity.email) {
    const username = identity.email.split('@')[0];
    await $`userdel -r ${username}`.nothrow().quiet();
  }

  await deleteTwilioPhoneNumber(identity);

  if (identity.location) {
    const country = identity.location.split(', ')[0].toLowerCase();
    await proxyRequest(country, 'DELETE', {username: identity.id});
  }
}

async function deleteIdentityRows(identityID: string) {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM accounts WHERE owner = ${identityID}`;
    await tx`DELETE FROM identities WHERE id = ${identityID}`;
  });
}

export async function cancelIdentityBilling(id: string, owner?: number) {
  const identity = await findIdentity(id, owner);
  if (!identity) return false;

  await cancelStripeBilling(identity);
  await deleteIdentityResources(identity);
  await deleteIdentityRows(identity.id);

  return true;
}

export async function deleteStripeCustomer(email: string, silent = false) {
  const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${email}`) as QueryUser[];
  const id = customer[0]?.stripe_customer || '';

  if (!id) return;

  try {
    await stripe.customers.del(id);
  } catch (err) {
    if (!silent) throw err;
  }
}

export async function deleteAccountBilling(account: AccountOwner) {
  const identities = (await sql`SELECT * FROM identities WHERE owner = ${account.id}`) as QueryIdentity[];

  for (const identity of identities) {
    await cancelStripeBilling(identity);
    await deleteIdentityResources(identity);
  }

  await deleteStripeCustomer(account.email, true);

  await sql.begin(async (tx) => {
    await tx`DELETE FROM accounts WHERE owner IN (SELECT id FROM identities WHERE owner = ${account.id})`;
    await tx`DELETE FROM identities WHERE owner = ${account.id}`;
    await tx`DELETE FROM crypto_invoices WHERE owner = ${account.id}`;
    await tx`DELETE FROM users WHERE id = ${account.id}`;
  });
}
