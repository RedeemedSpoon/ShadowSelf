import {log, reportFailure} from '@logging';
import {origin} from '@core/config';
import {recordStripeLifetimeReceipt, recordStripeInvoiceReceipt} from '@core/billing/billing-receipts';
import {BILLING_CURRENCY, PRICING_TIERS, STRIPE_EVENT_TYPES, STRIPE_EVENT_RETENTION_DAYS} from '@core/constants';
import {repairStripeCleanup} from '@core/billing/stripe-cleanup';
import {sql, stripe} from '@core/services';
import {repairPaymentInvoices, repairWalletSwapRequests} from '@core/providers/swap-provider';
import {withAccountLock, removeIdentityRecords} from '@core/identity/identity-service';
import type {QueryIdentity, StripeEventReference} from '@type';
import type Stripe from 'stripe';
import type {TransactionSql, ReservedSql} from 'postgres';
import {ApiError} from '@core/security';

export async function createBillingCustomer(
  email: string,
  payment?: string,
  provider: Stripe = stripe,
  connection?: ReservedSql,
) {
  const accounts = await sql`SELECT id, stripe_customer FROM users WHERE email = ${email}`;

  if (!accounts[0]) {
    throw new Error('Account not found');
  }

  const create = async (database: ReservedSql) => {
    const current = await database`SELECT id, stripe_customer FROM users WHERE id = ${accounts[0].id}`;

    if (!current.length) {
      throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
    }

    if (current[0].stripe_customer) {
      return current[0].stripe_customer;
    }

    const params = payment
      ? {email, payment_method: payment, invoice_settings: {default_payment_method: payment}}
      : {email};
    const customer = await provider.customers.create(params, {idempotencyKey: `customer:${current[0].id}`});
    await database`UPDATE users SET stripe_customer = ${customer.id} WHERE id = ${current[0].id}`;

    return customer.id;
  };

  return connection ? create(connection) : withAccountLock(accounts[0].id, create);
}

export async function billingPortal(email: string) {
  const accounts = await sql`SELECT stripe_customer FROM users WHERE email = ${email}`;

  if (!accounts[0]?.stripe_customer) {
    const customer = await createBillingCustomer(email);
    accounts[0].stripe_customer = customer;
  }

  await stripe.customers.update(accounts[0].stripe_customer, {email});

  const session = await stripe.billingPortal.sessions.create({
    customer: accounts[0].stripe_customer,
    return_url: `${origin}/settings`,
  });

  return {sessionUrl: session.url};
}

export async function processStripeEvent(id: string, provider: Stripe = stripe) {
  await sql.begin(async (transaction) => {
    const lock = await transaction`SELECT pg_try_advisory_xact_lock(81472632) AS acquired`;

    if (!lock[0].acquired) {
      return;
    }

    const rows =
      await transaction`SELECT id, type, object_id, completed_at FROM stripe_events WHERE id = ${id} FOR UPDATE`;

    if (!rows[0] || rows[0].completed_at) {
      return;
    }

    await applyStripeEvent(rows[0] as StripeEventReference, transaction, provider);
    await transaction`UPDATE stripe_events SET completed_at = NOW() WHERE id = ${id}`;
  });
}

export async function saveStripeEvent(event: Stripe.Event) {
  if (!(STRIPE_EVENT_TYPES as readonly string[]).includes(event.type) || !('id' in event.data.object)) {
    return;
  }

  await sql`INSERT INTO stripe_events (id, type, object_id)
    VALUES (${event.id}, ${event.type}, ${event.data.object.id}) ON CONFLICT DO NOTHING`;
}

export async function repairStripeEvents() {
  await sql`DELETE FROM stripe_events WHERE completed_at IS NOT NULL
    AND received_at < NOW() - ${STRIPE_EVENT_RETENTION_DAYS} * INTERVAL '1 day'`;

  let cursor = '';

  while (true) {
    const pending =
      await sql`SELECT id FROM stripe_events WHERE completed_at IS NULL AND id > ${cursor} ORDER BY id LIMIT 100`;

    for (const event of pending) {
      await processStripeEvent(event.id).catch(() => {});
    }

    if (pending.length < 100) {
      return;
    }

    cursor = pending[pending.length - 1].id;
  }
}

async function applyStripeEvent(event: StripeEventReference, transaction: TransactionSql, provider: Stripe) {
  if (event.type === 'payment_intent.succeeded') {
    await applyLifetimePayment(event.object_id, transaction, provider);
  }

  if (event.type === 'invoice.paid') {
    await applyPaidInvoice(event.object_id, transaction, provider);
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = await provider.invoices.retrieve(event.object_id);

    const reference = invoice.parent?.subscription_details?.subscription;
    const subscriptionID = typeof reference === 'string' ? reference : reference?.id;

    if (!subscriptionID) {
      return;
    }

    const current = await provider.subscriptions.retrieve(subscriptionID);

    if (['active', 'trialing'].includes(current.status)) {
      return;
    }

    await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${subscriptionID}`;
  }

  if (event.type === 'charge.refunded') {
    const charge = await provider.charges.retrieve(event.object_id);
    await applyChargeReversal(charge, transaction, provider);
  }

  if (event.type === 'charge.dispute.created' || event.type === 'charge.dispute.closed') {
    const dispute = await provider.disputes.retrieve(event.object_id);
    await applyChargeReversal(dispute, transaction, provider);
  }

  if (event.type.startsWith('refund.')) {
    await applyRefundUpdate(event.object_id, transaction, provider);
  }

  if (event.type === 'customer.subscription.deleted') {
    await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${event.object_id}`;
  }
}

async function applyLifetimePayment(id: string, transaction: TransactionSql, provider: Stripe) {
  const payment = await provider.paymentIntents.retrieve(id, {expand: ['latest_charge']});

  const charge = payment.latest_charge;

  if (
    payment.status !== 'succeeded' ||
    payment.currency !== BILLING_CURRENCY ||
    payment.amount_received !== PRICING_TIERS.lifetime
  ) {
    return;
  }

  if (charge && typeof charge !== 'string' && (charge.refunded || (await hasOpenDispute(charge, provider)))) {
    return;
  }

  if (payment.metadata?.invoice || !payment.metadata?.id || payment.metadata.type !== 'lifetime') {
    return;
  }

  const customer = typeof payment.customer === 'string' ? payment.customer : payment.customer?.id;

  if (!customer) {
    return;
  }

  await transaction`SELECT id FROM users WHERE stripe_customer = ${customer} FOR UPDATE`;

  const purchases = await transaction`SELECT f.identity_id, f.owner FROM fiat_intents f JOIN users u ON u.id = f.owner
    WHERE f.identity_id = ${payment.metadata.id} AND f.plan = 'lifetime' AND u.stripe_customer = ${customer}
    AND (f.provider_id IS NULL OR f.provider_id = ${payment.id}) FOR UPDATE OF u`;

  if (!purchases[0]) {
    return;
  }

  await transaction`INSERT INTO identities (id, owner, creation_date, plan, payment_intent)
    VALUES (${payment.metadata.id}, ${purchases[0].owner}, ${new Date(payment.created * 1000)}, 'lifetime', ${payment.id}) ON CONFLICT (id) DO NOTHING`;

  await recordStripeLifetimeReceipt(
    transaction,
    {
      owner: purchases[0].owner,
      identityID: payment.metadata.id,
    },
    payment,
  );
}

async function applyPaidInvoice(id: string, transaction: TransactionSql, provider: Stripe) {
  const invoice = await provider.invoices.retrieve(id);

  const reference = invoice.parent?.subscription_details?.subscription;
  const subscriptionID = typeof reference === 'string' ? reference : reference?.id;

  if (!subscriptionID) {
    return;
  }

  const current = await provider.subscriptions.retrieve(subscriptionID);

  const latestID = typeof current.latest_invoice === 'string' ? current.latest_invoice : current.latest_invoice?.id;
  const latest = latestID ? await provider.invoices.retrieve(latestID) : null;

  const plan = current.metadata.type as keyof typeof PRICING_TIERS;
  let paid =
    latest?.status === 'paid' &&
    latest.currency === BILLING_CURRENCY &&
    Object.hasOwn(PRICING_TIERS, plan) &&
    latest.amount_paid === PRICING_TIERS[plan];

  if (paid && latestID) {
    for await (const entry of provider.invoicePayments.list({invoice: latestID, limit: 100})) {
      const reference = entry.payment.payment_intent;
      const paymentID = typeof reference === 'string' ? reference : reference?.id;

      if (!paymentID) {
        continue;
      }

      const payment = await provider.paymentIntents.retrieve(paymentID, {expand: ['latest_charge']});

      const charge = payment.latest_charge;

      if (charge && typeof charge !== 'string' && (charge.refunded || (await hasOpenDispute(charge, provider)))) {
        paid = false;
      }
    }
  }

  if (!paid || !['active', 'trialing'].includes(current.status)) {
    await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${subscriptionID}`;

    return;
  }

  const customer = typeof current.customer === 'string' ? current.customer : current.customer.id;
  await transaction`SELECT id FROM users WHERE stripe_customer = ${customer} FOR UPDATE`;

  const purchases =
    await transaction`SELECT f.identity_id, f.owner, f.plan, f.provider_id FROM fiat_intents f JOIN users u ON u.id = f.owner
    WHERE f.identity_id = ${current.metadata.id || ''} AND f.plan = ${current.metadata.type || ''} AND u.stripe_customer = ${customer}
    AND (f.subscription_id IS NULL OR f.subscription_id = ${subscriptionID}) FOR UPDATE OF u`;

  const purchase = purchases[0];

  if (!purchase || !['monthly', 'annually'].includes(purchase.plan)) {
    return;
  }

  await transaction`INSERT INTO identities (id, owner, creation_date, plan, subscription_id, payment_intent)
    VALUES (${purchase.identity_id}, ${purchase.owner}, ${new Date(current.created * 1000)}, ${purchase.plan}, ${subscriptionID}, ${purchases[0].provider_id}) ON CONFLICT (id) DO NOTHING`;
  await transaction`UPDATE identities SET status = CASE
    WHEN EXISTS (SELECT 1 FROM creation_jobs WHERE identity_id = ${purchase.identity_id} AND status = 'completed') THEN 'active' ELSE 'inactive' END
    WHERE id = ${purchase.identity_id} AND owner = ${purchase.owner} AND subscription_id = ${subscriptionID} AND status = 'frozen'`;

  await recordStripeInvoiceReceipt(
    transaction,
    {
      owner: purchase.owner,
      identityID: purchase.identity_id,
      plan: purchase.plan,
    },
    invoice,
  );
}

async function applyChargeReversal(
  object: Stripe.Charge | Stripe.Dispute,
  transaction: TransactionSql,
  provider: Stripe,
) {
  const reference = object.payment_intent;
  const intentID = typeof reference === 'string' ? reference : reference?.id;

  if (!intentID) {
    return;
  }

  const cleanup = await transaction`SELECT customer_id FROM stripe_cleanup WHERE payment_intent = ${intentID}`;

  if (cleanup[0]) {
    const key = `stripe-customer:${cleanup[0].customer_id}`;
    const lock = await transaction`SELECT pg_try_advisory_xact_lock(hashtextextended(${key}, 0)) AS acquired`;

    if (!lock[0].acquired) {
      throw new Error('Stripe cleanup is running');
    }

    await transaction`UPDATE stripe_cleanup SET retry_at = NOW() WHERE payment_intent = ${intentID}`;
  }

  let identities = (await transaction`SELECT id FROM identities WHERE payment_intent = ${intentID}`) as QueryIdentity[];

  if (!identities.length) {
    const payments = await provider.invoicePayments.list({
      payment: {type: 'payment_intent', payment_intent: intentID},
      limit: 1,
    });

    if (!payments.data[0]) {
      return;
    }

    const invoiceReference = payments.data[0].invoice;
    const invoiceID = typeof invoiceReference === 'string' ? invoiceReference : invoiceReference.id;
    const invoice = await provider.invoices.retrieve(invoiceID);

    const subscription = invoice.parent?.subscription_details?.subscription;
    const subscriptionID = typeof subscription === 'string' ? subscription : subscription?.id;

    if (subscriptionID) {
      identities = await transaction`SELECT id FROM identities WHERE subscription_id = ${subscriptionID}`;
    }
  }

  for (const identity of identities) {
    const owners = await transaction`SELECT owner FROM identities WHERE id = ${identity.id}`;

    if (!owners[0]) {
      continue;
    }

    await transaction`SELECT id FROM users WHERE id = ${owners[0].owner} FOR UPDATE`;

    if ('refunded' in object && object.refunded) {
      await removeIdentityRecords(identity.id, owners[0].owner, transaction);

      continue;
    }

    const rows = await transaction`SELECT payment_intent, subscription_id FROM identities WHERE id = ${identity.id}`;

    if ('charge' in object && !['won', 'warning_closed'].includes(object.status)) {
      if (object.status === 'lost' && rows[0]?.subscription_id) {
        await provider.subscriptions.update(
          rows[0].subscription_id,
          {cancel_at_period_end: true},
          {idempotencyKey: `dispute-cancellation:${object.id}`},
        );
      }

      await transaction`UPDATE identities SET status = 'frozen' WHERE id = ${identity.id}`;

      continue;
    }

    if (rows[0]?.subscription_id) {
      const subscription = await provider.subscriptions.retrieve(rows[0].subscription_id);
      const reference = subscription.latest_invoice;
      const invoiceID = typeof reference === 'string' ? reference : reference?.id;

      if (invoiceID) {
        await applyPaidInvoice(invoiceID, transaction, provider);
      }
    } else {
      const payment = await provider.paymentIntents.retrieve(intentID, {expand: ['latest_charge']});
      const charge = payment.latest_charge;
      const reversed =
        !charge || typeof charge === 'string' || charge.refunded || (await hasOpenDispute(charge, provider));

      if (reversed) {
        await transaction`UPDATE identities SET status = 'frozen' WHERE id = ${identity.id}`;
      } else {
        await restoreIdentity(identity.id, transaction);
      }
    }
  }
}

async function hasOpenDispute(charge: Stripe.Charge, provider: Stripe) {
  if (!charge.disputed) {
    return false;
  }

  for await (const dispute of provider.disputes.list({charge: charge.id, limit: 100})) {
    if (!['won', 'warning_closed'].includes(dispute.status)) {
      return true;
    }
  }

  return false;
}

async function restoreIdentity(id: string, transaction: TransactionSql) {
  await transaction`UPDATE identities SET status = CASE
    WHEN EXISTS (SELECT 1 FROM creation_jobs WHERE identity_id = ${id} AND status = 'completed')
    THEN 'active' ELSE 'inactive' END WHERE id = ${id} AND status = 'frozen'`;
}

async function applyRefundUpdate(id: string, transaction: TransactionSql, provider: Stripe) {
  const refund = await provider.refunds.retrieve(id);

  if (refund.metadata?.purpose !== 'identity_refund') {
    return;
  }

  const reference = refund.payment_intent;
  const paymentID = typeof reference === 'string' ? reference : reference?.id;

  if (!paymentID) {
    return;
  }

  const payment = await provider.paymentIntents.retrieve(paymentID);
  const customer = typeof payment.customer === 'string' ? payment.customer : payment.customer?.id;

  if (!customer) {
    return;
  }

  const lock =
    await transaction`SELECT pg_try_advisory_xact_lock(hashtextextended(${'stripe-customer:' + customer}, 0)) AS acquired`;

  if (!lock[0].acquired) {
    throw new Error('Stripe cleanup is running');
  }

  await transaction`INSERT INTO stripe_cleanup (customer_id, payment_intent, refund_requested)
    VALUES (${customer}, ${paymentID}, true) ON CONFLICT (payment_intent)
    DO UPDATE SET retry_at = NOW()`;
}

async function recoverStripeEvents(since: number) {
  for await (const event of stripe.events.list({created: {gte: since}, types: [...STRIPE_EVENT_TYPES], limit: 100})) {
    await saveStripeEvent(event);
  }

  await repairStripeEvents();
  await repairStripeCleanup();
}

async function reconcileBilling() {
  const since = new Date(process.argv[2] || '').getTime();

  if (!Number.isFinite(since) || since > Date.now() || since < Date.now() - 30 * 86_400_000) {
    throw new Error('Provide an ISO start date within the last 30 days');
  }

  try {
    const intents =
      await sql`SELECT f.*, u.stripe_customer FROM fiat_intents f JOIN users u ON u.id = f.owner WHERE f.provider_id IS NULL`;

    for (const intent of intents) {
      if (!intent.stripe_customer) {
        log('error', `Payment request ${intent.id} has no billing customer; manual review required`);
        continue;
      }

      const matches: string[] = [];

      if (intent.plan === 'lifetime') {
        for await (const payment of stripe.paymentIntents.list({customer: intent.stripe_customer, limit: 100})) {
          if (payment.metadata.id === intent.identity_id) {
            matches.push(payment.id);
          }
        }

        if (matches.length === 1) {
          await sql`UPDATE fiat_intents SET provider_id = ${matches[0]} WHERE id = ${intent.id} AND provider_id IS NULL`;
        }
      } else {
        for await (const subscription of stripe.subscriptions.list({
          customer: intent.stripe_customer,
          status: 'all',
          limit: 100,
        })) {
          if (subscription.metadata.id === intent.identity_id) {
            matches.push(subscription.id);
          }
        }

        if (matches.length === 1) {
          await sql`UPDATE fiat_intents SET subscription_id = ${matches[0]} WHERE id = ${intent.id} AND subscription_id IS NULL`;
        }
      }

      if (matches.length !== 1) {
        log(
          'error',
          `Payment request ${intent.id} requires manual review; found ${matches.length} matching provider objects`,
        );
      }
    }

    await recoverStripeEvents(Math.floor(since / 1000));

    const blocked = await sql`SELECT id, error_code FROM stripe_cleanup WHERE retry_at IS NULL`;

    for (const job of blocked) {
      log('error', `Stripe cleanup ${job.id} needs attention: ${job.error_code}`);
    }

    if (blocked.length) {
      process.exitCode = 1;
    }

    await repairPaymentInvoices();
    await repairWalletSwapRequests();
  } finally {
    await sql.end({timeout: 5});
  }
}

if (import.meta.main) {
  void reconcileBilling().catch((failure) => {
    reportFailure('Billing reconciliation', failure);
    process.exitCode = 1;
  });
}
