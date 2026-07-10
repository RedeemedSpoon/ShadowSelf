import type {QueryIdentity, QueryUser} from '@type';
import {proxyRequest} from '@utils/utils';
import {sql, stripe, twilio} from '@core/services';
import type Stripe from 'stripe';
import {$} from 'bun';

type AccountOwner = Pick<QueryUser, 'id' | 'email'>;
type FiatIdentityStatus = Extract<QueryIdentity['status'], 'active' | 'frozen'>;

const terminalSubscriptionStatuses = new Set(['canceled', 'incomplete_expired', 'paused', 'unpaid']);
const activeSubscriptionStatuses = new Set(['active', 'trialing']);

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

function getStripeResourceID(resource: string | {id: string} | null | undefined) {
  return typeof resource === 'string' ? resource : resource?.id || '';
}

function isMissingStripeResource(err: unknown) {
  if (!err || typeof err !== 'object') return false;

  const details = err as {statusCode?: number; status?: number; code?: string};
  return details.statusCode === 404 || details.status === 404 || details.code === 'resource_missing';
}

function isInvoicePaid(invoice: Stripe.Invoice) {
  return invoice.status === 'paid' || invoice.amount_remaining === 0;
}

function isInvoiceTerminallyUnpaid(invoice: Stripe.Invoice) {
  return invoice.status === 'uncollectible' || invoice.status === 'void';
}

async function retrieveLatestInvoice(subscription: Stripe.Subscription) {
  const invoice = subscription.latest_invoice;
  const invoiceID = getStripeResourceID(invoice);

  if (!invoiceID) return null;
  return typeof invoice === 'string' ? await stripe.invoices.retrieve(invoiceID) : invoice;
}

async function retrieveInvoicePaymentStatus(invoiceID: string) {
  const payments = await stripe.invoicePayments.list({
    invoice: invoiceID,
    limit: 1,
    expand: ['data.payment.payment_intent'],
  });
  const paymentIntent = payments.data[0]?.payment?.payment_intent;

  return typeof paymentIntent === 'string' ? '' : paymentIntent?.status || '';
}

async function resolveFiatSubscriptionStatus(subscription: Stripe.Subscription, invoice?: Stripe.Invoice) {
  if (terminalSubscriptionStatuses.has(subscription.status)) return 'frozen';

  const latestInvoice = invoice || (await retrieveLatestInvoice(subscription));
  if (latestInvoice && isInvoicePaid(latestInvoice)) return 'active';
  if (activeSubscriptionStatuses.has(subscription.status)) return 'active';
  if (latestInvoice && isInvoiceTerminallyUnpaid(latestInvoice)) return 'frozen';

  const invoiceID = latestInvoice?.id || getStripeResourceID(subscription.latest_invoice);
  if (!invoiceID) return 'frozen';

  const paymentStatus = await retrieveInvoicePaymentStatus(invoiceID);
  if (paymentStatus === 'succeeded') return 'active';
  return 'frozen';
}

export async function getFiatSubscriptionStatus(subscriptionID: string, invoice?: Stripe.Invoice): Promise<FiatIdentityStatus> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionID, {expand: ['latest_invoice']});
    return await resolveFiatSubscriptionStatus(subscription, invoice);
  } catch (err) {
    if (isMissingStripeResource(err)) return 'frozen';
    throw err;
  }
}

export async function reconcileFiatIdentityStatus(identity: QueryIdentity) {
  if (!identity.subscription_id || identity.crypto_invoice) return identity.status;

  const status = await getFiatSubscriptionStatus(identity.subscription_id);
  if (status !== identity.status) {
    await sql`UPDATE identities SET status = ${status} WHERE id = ${identity.id}`;
    identity.status = status;
  }

  return status;
}

export async function reconcileFiatSubscriptionStatus(subscriptionID: string, invoice?: Stripe.Invoice) {
  const status = await getFiatSubscriptionStatus(subscriptionID, invoice);
  await sql`UPDATE identities SET status = ${status} WHERE subscription_id = ${subscriptionID}`;
  return status;
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
    const deletedIdentities = (await tx`
      SELECT crypto_invoice
      FROM identities
      WHERE id = ${identityID}
    `) as Pick<QueryIdentity, 'crypto_invoice'>[];
    const cryptoInvoice = deletedIdentities[0]?.crypto_invoice || null;

    await tx`DELETE FROM accounts WHERE owner = ${identityID}`;
    await tx`DELETE FROM identities WHERE id = ${identityID}`;

    await tx`
      DELETE FROM crypto_invoices c
      WHERE (c.renewal_id = ${identityID} OR c.id = ${cryptoInvoice})
        AND NOT EXISTS (
          SELECT 1
          FROM identities i
          WHERE i.crypto_invoice = c.id
        )
    `;
  });
}

export async function deleteExpiredCryptoInvoices() {
  await sql`
    DELETE FROM crypto_invoices c
    WHERE c.status = 'expired'
      AND NOT EXISTS (
        SELECT 1
        FROM identities i
        WHERE i.crypto_invoice = c.id
      )
  `;
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
    await tx`
      DELETE FROM crypto_invoices c
      WHERE c.owner = ${account.id}
        AND NOT EXISTS (
          SELECT 1
          FROM identities i
          WHERE i.crypto_invoice = c.id
        )
    `;
    await tx`DELETE FROM users WHERE id = ${account.id}`;
  });
}
