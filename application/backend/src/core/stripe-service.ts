import {sql, stripe} from '@core/services';
import type {QueryIdentity, QueryUser} from '@type';
import type Stripe from 'stripe';
import type {TransactionSql} from 'postgres';

export async function processStripeEvent(id: string) {
  await sql.begin(async (transaction) => {
    const lock = await transaction`SELECT pg_try_advisory_xact_lock(81472632) AS acquired`;
    if (!lock[0].acquired) return;
    const rows = await transaction`SELECT payload, completed_at FROM stripe_events WHERE id = ${id} FOR UPDATE`;
    if (!rows[0] || rows[0].completed_at) return;

    await applyStripeEvent(rows[0].payload, transaction);
    await transaction`UPDATE stripe_events SET completed_at = NOW() WHERE id = ${id}`;
  });
}

export async function repairStripeEvents() {
  let cursor = '';
  while (true) {
    const pending = await sql`SELECT id FROM stripe_events WHERE completed_at IS NULL AND id > ${cursor} ORDER BY id LIMIT 100`;
    for (const event of pending) await processStripeEvent(event.id).catch(() => {});
    if (pending.length < 100) return;

    cursor = pending[pending.length - 1].id;
  }
}

async function applyStripeEvent(event: Stripe.Event, transaction: TransactionSql) {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = await stripe.paymentIntents.retrieve(event.data.object.id, {expand: ['latest_charge']});
    const charge = paymentIntent.latest_charge;
    if (charge && typeof charge !== 'string' && (charge.amount_refunded > 0 || charge.disputed)) return;

    if (!paymentIntent.metadata?.invoice && paymentIntent.metadata?.id && paymentIntent.metadata?.type) {
      const customerID = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id;
      const intentID = paymentIntent.id;

      const date = new Date(paymentIntent.created * 1000);
      const identityID = paymentIntent.metadata.id;
      const plan = paymentIntent.metadata.type;

      if (customerID) {
        const userQuery = (await transaction`SELECT id FROM users WHERE stripe_customer = ${customerID}`) as QueryUser[];
        if (!userQuery[0]) return;
        const deleted = await transaction`SELECT identity_id FROM identity_deletions WHERE identity_id = ${identityID}`;
        if (deleted.length) return;
        const owner = userQuery[0].id;

        const alreadyExists = await transaction`SELECT id FROM identities WHERE id = ${identityID}`;
        if (alreadyExists.length) return;

        await transaction`INSERT INTO identities (id, owner, creation_date, plan, payment_intent) VALUES (${identityID}, ${owner}, ${date}, ${plan}, ${intentID})`;
      }
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = await stripe.invoices.retrieve(event.data.object.id);

    const isSubscription = invoice.parent?.type === 'subscription_details';
    const subObj = isSubscription ? invoice.parent?.subscription_details?.subscription : null;
    const subscriptionID = typeof subObj === 'string' ? subObj : subObj?.id;

    if (subscriptionID) {
      const current = await stripe.subscriptions.retrieve(subscriptionID);
      const latestID = typeof current.latest_invoice === 'string' ? current.latest_invoice : current.latest_invoice?.id;
      const latest = latestID ? await stripe.invoices.retrieve(latestID) : null;
      let paid = latest?.status === 'paid';
      if (paid && latestID) {
        for await (const entry of stripe.invoicePayments.list({invoice: latestID, limit: 100})) {
          const reference = entry.payment.payment_intent;
          const id = typeof reference === 'string' ? reference : reference?.id;
          if (!id) continue;
          const payment = await stripe.paymentIntents.retrieve(id, {expand: ['latest_charge']});
          const charge = payment.latest_charge;
          if (charge && typeof charge !== 'string' && (charge.amount_refunded > 0 || charge.disputed)) paid = false;
        }
      }
      if (!paid || !['active', 'trialing'].includes(current.status)) {
        await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${subscriptionID} AND status <> 'deleting'`;
        return;
      }
      if (invoice.customer) {
        const customerID = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
        const date = new Date(invoice.created * 1000);

        const subscription = await stripe.subscriptions.retrieve(subscriptionID);
        const identityID = subscription.metadata!.id;
        const plan = subscription.metadata!.type;

        const userQuery = (await transaction`SELECT id FROM users WHERE stripe_customer = ${customerID}`) as QueryUser[];
        if (!userQuery[0]) return;
        const deleted = await transaction`SELECT identity_id FROM identity_deletions WHERE identity_id = ${identityID}`;
        if (deleted.length) return;
        const owner = userQuery[0].id;

        const alreadyExists = await transaction`SELECT id FROM identities WHERE id = ${identityID}`;
        if (alreadyExists.length) {
          await transaction`UPDATE identities SET status = 'active' WHERE id = ${identityID} AND status = 'frozen'`;
          return;
        }

        await transaction`INSERT INTO identities (id, owner, creation_date, plan, subscription_id) VALUES (${identityID}, ${owner}, ${date}, ${plan}, ${subscriptionID})`;
      } else {
        await transaction`UPDATE identities SET status = 'active' WHERE subscription_id = ${subscriptionID} AND status = 'frozen'`;
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = await stripe.invoices.retrieve(event.data.object.id);

    const isSubscription = invoice.parent?.type === 'subscription_details';
    const subObj = isSubscription ? invoice.parent?.subscription_details?.subscription : null;
    const subscriptionID = typeof subObj === 'string' ? subObj : subObj?.id;

    if (subscriptionID) {
      const current = await stripe.subscriptions.retrieve(subscriptionID);
      if (['active', 'trialing'].includes(current.status)) return;
      await transaction`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${subscriptionID} AND status <> 'deleting'`;
    }
  }

  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    const object = event.data.object as Stripe.Charge | Stripe.Dispute;
    let identityQuery = [] as QueryIdentity[];

    const intentObj = 'payment_intent' in object ? object.payment_intent : null;
    const intentID = typeof intentObj === 'string' ? intentObj : intentObj?.id;

    if (intentID) {
      identityQuery = await transaction`SELECT id FROM identities WHERE payment_intent = ${intentID}`;

      if (identityQuery.length === 0) {
        const payments = await stripe.invoicePayments.list({
          payment: {type: 'payment_intent', payment_intent: intentID},
          limit: 1,
        });

        if (payments.data.length > 0) {
          const invoiceObj = payments.data[0].invoice;
          const invoiceID = typeof invoiceObj === 'string' ? invoiceObj : invoiceObj.id;
          const invoice = await stripe.invoices.retrieve(invoiceID);

          const isSubscription = invoice.parent?.type === 'subscription_details';
          const subObj = isSubscription ? invoice.parent?.subscription_details?.subscription : null;
          const subID = typeof subObj === 'string' ? subObj : subObj?.id;

          if (subID) {
            identityQuery = await transaction`SELECT id FROM identities WHERE subscription_id = ${subID}`;
          }
        }
      }
    }

    if (identityQuery.length) {
      await transaction`UPDATE identities SET status = 'frozen' WHERE id = ${identityQuery[0].id} AND status <> 'deleting'`;
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const exist = await transaction`SELECT id FROM identities WHERE subscription_id = ${subscription.id}`;
    if (exist.length) await transaction`UPDATE identities SET status = 'frozen' WHERE id = ${exist[0].id} AND status <> 'deleting'`;
  }
}

export async function recoverStripeEvents(since: number) {
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
