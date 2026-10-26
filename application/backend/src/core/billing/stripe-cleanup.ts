import {log, reportFailure} from '@logging';
import {sql, stripe} from '@core/services';
import {ApiError} from '@core/security';
import {withIdentityLock} from '@core/identity/identity-service';
import type {StripeCleanup} from '@type';
import type {ReservedSql} from 'postgres';
import type Stripe from 'stripe';

export async function repairStripeCleanup(provider: Stripe = stripe) {
  const jobs = await sql`SELECT id, customer_id FROM stripe_cleanup WHERE retry_at <= NOW()
    ORDER BY (checkout_reference IS NULL AND subscription_id IS NULL AND payment_intent IS NULL), retry_at LIMIT 25`;

  for (const job of jobs) {
    try {
      await withIdentityLock(`stripe-customer:${job.customer_id}`, async (connection) => {
        const rows = await connection`SELECT * FROM stripe_cleanup WHERE id = ${job.id} AND retry_at <= NOW()`;

        if (rows[0]) {
          await processCleanup(rows[0] as StripeCleanup, connection, provider);
        }
      });
    } catch (failure) {
      reportFailure(`Stripe cleanup ${job.id}; deferred`, failure);
    }
  }
}

async function processCleanup(job: StripeCleanup, connection: ReservedSql, provider: Stripe) {
  let code: string | null;

  try {
    code = await settleCleanup(job, connection, provider);
  } catch (failure) {
    const status = (failure as {statusCode?: number}).statusCode;
    code =
      failure instanceof ApiError
        ? failure.code
        : status && status >= 400 && status < 500 && ![409, 429].includes(status)
          ? 'provider_rejected'
          : 'provider_unavailable';
  }

  if (!code) {
    await connection`DELETE FROM stripe_cleanup WHERE id = ${job.id}`;

    return;
  }

  const blocked = [
    'refund_failed',
    'billing_reference_missing',
    'billing_reference_mismatch',
    'billing_reference_ambiguous',
    'provider_rejected',
  ].includes(code);
  const delay = Math.min(3600, 15 * 2 ** Math.min(job.attempts, 8));
  const retryAt = blocked ? null : new Date(Date.now() + delay * 1000);

  await connection`UPDATE stripe_cleanup SET retry_at = ${retryAt}, attempts = attempts + 1,
    error_code = ${code} WHERE id = ${job.id}`;

  if (blocked && job.error_code !== code) {
    log('error', `Stripe cleanup ${job.id} needs attention: ${code}`);
  }
}

async function settleCleanup(job: StripeCleanup, connection: ReservedSql, provider: Stripe): Promise<string | null> {
  if (job.checkout_reference && !job.subscription_id && !job.payment_intent) {
    const unresolved = await resolveCheckout(job, connection, provider);

    if (unresolved) {
      return unresolved;
    }
  }

  if (!job.subscription_id && !job.payment_intent) {
    const pending = await connection`SELECT 1 FROM stripe_cleanup WHERE customer_id = ${job.customer_id}
      AND id <> ${job.id} LIMIT 1`;

    if (pending.length) {
      return 'payments_pending';
    }

    try {
      await provider.customers.del(job.customer_id);
    } catch (failure) {
      if ((failure as {code?: string}).code !== 'resource_missing') {
        throw failure;
      }
    }

    return null;
  }

  if (job.subscription_id) {
    await cancelSubscription(job, connection, provider);
  }

  if (!job.payment_intent) {
    return job.refund_requested ? 'billing_reference_missing' : null;
  }

  const payment = await provider.paymentIntents.retrieve(job.payment_intent, {expand: ['latest_charge']});
  const customer = typeof payment.customer === 'string' ? payment.customer : payment.customer?.id;

  if (customer !== job.customer_id) {
    return 'billing_reference_mismatch';
  }

  if (!['succeeded', 'canceled'].includes(payment.status)) {
    try {
      await provider.paymentIntents.cancel(payment.id, {}, {idempotencyKey: `cancel-payment:${job.id}`});
    } catch (failure) {
      if ((failure as {code?: string}).code !== 'payment_intent_unexpected_state') {
        throw failure;
      }
    }

    return 'payment_processing';
  }

  if (!job.refund_requested || payment.status === 'canceled' || payment.amount_received === 0) {
    return null;
  }

  return refundPayment(job, payment, provider);
}

async function resolveCheckout(job: StripeCleanup, connection: ReservedSql, provider: Stripe) {
  const payments: string[] = [];
  const subscriptions: string[] = [];

  for await (const payment of provider.paymentIntents.list({customer: job.customer_id, limit: 100})) {
    if (payment.metadata.id === job.checkout_reference) {
      payments.push(payment.id);
    }
  }

  for await (const subscription of provider.subscriptions.list({
    customer: job.customer_id,
    status: 'all',
    limit: 100,
  })) {
    if (subscription.metadata.id === job.checkout_reference) {
      subscriptions.push(subscription.id);
    }
  }

  if (payments.length > 1 || subscriptions.length > 1 || (payments.length && subscriptions.length)) {
    return 'billing_reference_ambiguous';
  }

  if (!payments.length && !subscriptions.length) {
    return Date.now() - new Date(job.requested_at).getTime() >= 86_400_000
      ? 'billing_reference_missing'
      : 'payment_processing';
  }

  job.payment_intent = payments[0] || null;
  job.subscription_id = subscriptions[0] || null;
  await connection`UPDATE stripe_cleanup SET payment_intent = ${job.payment_intent},
    subscription_id = ${job.subscription_id}, checkout_reference = NULL WHERE id = ${job.id}`;

  return null;
}

async function cancelSubscription(job: StripeCleanup, connection: ReservedSql, provider: Stripe) {
  let subscription: Stripe.Subscription;

  try {
    subscription = await provider.subscriptions.retrieve(job.subscription_id!);
  } catch (failure) {
    if ((failure as {code?: string}).code !== 'resource_missing') {
      throw failure;
    }

    await resumeInvoices(job, connection, provider);

    return;
  }

  const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  if (customer !== job.customer_id) {
    throw new ApiError(503, 'billing_reference_mismatch', 'Subscription customer mismatch');
  }

  if (!job.payment_intent && job.refund_requested) {
    const payment = await initialSubscriptionPayment(subscription.id, provider);

    if (payment) {
      await connection`UPDATE stripe_cleanup SET payment_intent = ${payment} WHERE id = ${job.id}`;
      job.payment_intent = payment;
    }
  }

  if (subscription.status !== 'canceled') {
    const invoices = new Set(job.resume_invoices);

    for await (const invoice of provider.invoices.list({customer: job.customer_id, status: 'open', limit: 100})) {
      const reference = invoice.parent?.subscription_details?.subscription;
      const subscriptionID = typeof reference === 'string' ? reference : reference?.id;

      if (invoice.auto_advance && subscriptionID && subscriptionID !== subscription.id) {
        invoices.add(invoice.id);
      }
    }

    job.resume_invoices = [...invoices];
    await connection`UPDATE stripe_cleanup SET resume_invoices = ${job.resume_invoices} WHERE id = ${job.id}`;
    await provider.subscriptions.cancel(
      subscription.id,
      {invoice_now: false, prorate: false},
      {idempotencyKey: `cancel-subscription:${job.id}`},
    );
  }

  await resumeInvoices(job, connection, provider);
}

async function resumeInvoices(job: StripeCleanup, connection: ReservedSql, provider: Stripe) {
  for (const id of job.resume_invoices) {
    const invoice = await provider.invoices.retrieve(id);
    const reference = invoice.parent?.subscription_details?.subscription;
    const subscriptionID = typeof reference === 'string' ? reference : reference?.id;

    if (invoice.status !== 'open' || invoice.auto_advance || !subscriptionID) {
      continue;
    }

    const canceled = await connection`SELECT 1 FROM stripe_cleanup WHERE subscription_id = ${subscriptionID} LIMIT 1`;

    if (canceled.length) {
      continue;
    }

    const subscription = await provider.subscriptions.retrieve(subscriptionID);

    if (['active', 'trialing', 'past_due'].includes(subscription.status) && !subscription.pause_collection) {
      await provider.invoices.update(id, {auto_advance: true});
    }
  }
}

async function initialSubscriptionPayment(subscription: string, provider: Stripe) {
  for await (const invoice of provider.invoices.list({subscription, limit: 100})) {
    if (invoice.billing_reason !== 'subscription_create') {
      continue;
    }

    for await (const entry of provider.invoicePayments.list({invoice: invoice.id, limit: 100})) {
      const reference = entry.payment.payment_intent;

      if (reference) {
        return typeof reference === 'string' ? reference : reference.id;
      }
    }
  }

  return null;
}

async function refundPayment(job: StripeCleanup, payment: Stripe.PaymentIntent, provider: Stripe) {
  const charge = payment.latest_charge;

  if (!charge || typeof charge === 'string') {
    return 'billing_reference_missing';
  }

  let disputedAmount = 0;

  if (charge.disputed) {
    for await (const dispute of provider.disputes.list({charge: charge.id, limit: 100})) {
      if (dispute.status === 'lost') {
        disputedAmount += dispute.amount;

        continue;
      }

      if (!['won', 'warning_closed'].includes(dispute.status)) {
        return 'payment_disputed';
      }
    }
  }

  let refunded = disputedAmount;
  let pending = false;
  let failed = false;
  let action = false;

  for await (const refund of provider.refunds.list({payment_intent: payment.id, limit: 100})) {
    refunded += refund.status === 'succeeded' ? refund.amount : 0;
    pending ||= refund.status === 'pending';
    action ||= refund.status === 'requires_action';
    failed ||= refund.status === 'failed' || refund.status === 'canceled';
  }

  if (refunded >= payment.amount_received) {
    return null;
  }

  if (action || pending || failed) {
    return action ? 'refund_requires_action' : pending ? 'refund_pending' : 'refund_failed';
  }

  const refund = await provider.refunds.create(
    {
      payment_intent: payment.id,
      amount: payment.amount_received - refunded,
      reason: 'requested_by_customer',
      metadata: {purpose: 'identity_refund'},
    },
    {idempotencyKey: `refund:${job.id}:${refunded}`},
  );

  if (refund.status === 'succeeded') {
    return null;
  }

  return refund.status === 'requires_action'
    ? 'refund_requires_action'
    : refund.status === 'failed' || refund.status === 'canceled'
      ? 'refund_failed'
      : 'refund_pending';
}
