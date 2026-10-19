import {origin} from '@core/config';
import {BILLING_CURRENCY, PRICING_TIERS} from '@core/constants';
import {sql, stripe} from '@core/services';
import {repairPaymentInvoices, repairWalletSwapRequests} from '@core/swap-provider';
import {withAccountLock} from '@core/identity-service';
import type {QueryIdentity} from '@type';
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

    const rows = await transaction`SELECT payload, completed_at FROM stripe_events WHERE id = ${id} FOR UPDATE`;

    if (!rows[0] || rows[0].completed_at) {
      return;
    }

    await applyStripeEvent(rows[0].payload, transaction, provider);
    await transaction`UPDATE stripe_events SET completed_at = NOW() WHERE id = ${id}`;
  });
}

export async function repairStripeEvents() {
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

async function applyStripeEvent(event: Stripe.Event, transaction: TransactionSql, provider: Stripe) {
  if (event.type === 'payment_intent.succeeded') {
    await applyLifetimePayment(event.data.object.id, transaction, provider);
  }

  if (event.type === 'invoice.paid') {
    await applyPaidInvoice(event.data.object.id, transaction, provider);
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = await provider.invoices.retrieve(event.data.object.id);

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

  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    await applyChargeReversal(event.data.object, transaction, provider);
  }

  if (event.type === 'customer.subscription.deleted') {
    await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${event.data.object.id}`;
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

  if (charge && typeof charge !== 'string' && (charge.amount_refunded > 0 || charge.disputed)) {
    return;
  }

  if (payment.metadata?.invoice || !payment.metadata?.id || payment.metadata.type !== 'lifetime') {
    return;
  }

  const customer = typeof payment.customer === 'string' ? payment.customer : payment.customer?.id;

  if (!customer) {
    return;
  }

  const purchases = await transaction`SELECT f.identity_id, f.owner FROM fiat_intents f JOIN users u ON u.id = f.owner
    WHERE f.identity_id = ${payment.metadata.id} AND f.plan = 'lifetime' AND u.stripe_customer = ${customer}
    AND (f.provider_id IS NULL OR f.provider_id = ${payment.id}) FOR UPDATE OF u`;

  if (!purchases[0]) {
    return;
  }

  await transaction`INSERT INTO identities (id, owner, creation_date, plan, payment_intent)
    VALUES (${payment.metadata.id}, ${purchases[0].owner}, ${new Date(payment.created * 1000)}, 'lifetime', ${payment.id}) ON CONFLICT (id) DO NOTHING`;
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

  let paid = latest?.status === 'paid';

  if (paid && latestID) {
    for await (const entry of provider.invoicePayments.list({invoice: latestID, limit: 100})) {
      const reference = entry.payment.payment_intent;
      const paymentID = typeof reference === 'string' ? reference : reference?.id;

      if (!paymentID) {
        continue;
      }

      const payment = await provider.paymentIntents.retrieve(paymentID, {expand: ['latest_charge']});

      const charge = payment.latest_charge;

      if (charge && typeof charge !== 'string' && (charge.amount_refunded > 0 || charge.disputed)) {
        paid = false;
      }
    }
  }

  if (!paid || !['active', 'trialing'].includes(current.status)) {
    await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${subscriptionID}`;

    return;
  }

  const customer = typeof current.customer === 'string' ? current.customer : current.customer.id;
  const purchases =
    await transaction`SELECT f.identity_id, f.owner, f.plan FROM fiat_intents f JOIN users u ON u.id = f.owner
    WHERE f.identity_id = ${current.metadata.id || ''} AND f.plan = ${current.metadata.type || ''} AND u.stripe_customer = ${customer}
    AND (f.subscription_id IS NULL OR f.subscription_id = ${subscriptionID}) FOR UPDATE OF u`;

  const purchase = purchases[0];

  if (!purchase || !['monthly', 'annually'].includes(purchase.plan)) {
    return;
  }

  await transaction`INSERT INTO identities (id, owner, creation_date, plan, subscription_id)
    VALUES (${purchase.identity_id}, ${purchase.owner}, ${new Date(invoice.created * 1000)}, ${purchase.plan}, ${subscriptionID}) ON CONFLICT (id) DO NOTHING`;
  await transaction`UPDATE identities SET status = CASE
    WHEN EXISTS (SELECT 1 FROM creation_jobs WHERE identity_id = ${purchase.identity_id} AND status = 'completed') THEN 'active' ELSE 'inactive' END
    WHERE id = ${purchase.identity_id} AND owner = ${purchase.owner} AND subscription_id = ${subscriptionID} AND status = 'frozen'`;
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
    await transaction`UPDATE identities SET status = 'frozen' WHERE id = ${identity.id}`;
  }
}

async function recoverStripeEvents(since: number) {
  const types = [
    'payment_intent.succeeded',
    'invoice.paid',
    'invoice.payment_failed',
    'charge.refunded',
    'charge.dispute.created',
    'customer.subscription.deleted',
  ];

  for await (const event of stripe.events.list({created: {gte: since}, types, limit: 100})) {
    await sql`INSERT INTO stripe_events (id, payload) VALUES (${event.id}, ${sql.json(JSON.parse(JSON.stringify(event)))}) ON CONFLICT DO NOTHING`;
  }

  await repairStripeEvents();
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
        console.error(`Payment request ${intent.id} has no billing customer; manual review required`);
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
        console.error(
          `Payment request ${intent.id} requires manual review; found ${matches.length} matching provider objects`,
        );
      }
    }

    await recoverStripeEvents(Math.floor(since / 1000));

    await repairPaymentInvoices();
    await repairWalletSwapRequests();
  } finally {
    await sql.end({timeout: 5});
  }
}

if (import.meta.main) {
  void reconcileBilling().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Billing reconciliation failed');
    process.exitCode = 1;
  });
}
