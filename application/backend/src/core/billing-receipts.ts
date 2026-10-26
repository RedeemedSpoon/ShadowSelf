import {billingTransporter, sql} from '@core/services';
import {billingReceiptEmail} from '@core/billing-receipt-email';
import {BILLING_RECEIPT_BATCH_SIZE, BILLING_RECEIPT_RETRY_MS, BILLING_RECEIPT_MAX_RETRY_MS} from '@core/constants';
import type {BillingReceipt, BillingReceiptDelivery, BillingReceiptInput, BillingReceiptRecord} from '@type';
import type Stripe from 'stripe';
import {BILLING_CURRENCY} from '@core/constants';
import type {Sql, TransactionSql, ReservedSql} from 'postgres';

export async function enqueueBillingReceipt(connection: TransactionSql | ReservedSql, input: BillingReceiptInput) {
  const rows = await connection`INSERT INTO billing_receipts (owner, identity_id, provider, provider_reference, details)
    VALUES (${input.owner}, ${input.identityID}, ${input.provider}, ${input.providerReference}, ${connection.json(input.details as never)})
    ON CONFLICT (provider, provider_reference) DO NOTHING RETURNING id`;

  if (!rows[0]) {
    return;
  }

  await connection`INSERT INTO billing_receipt_deliveries (receipt_id, recipient_role)
    VALUES (${rows[0].id}, 'account'), (${rows[0].id}, 'identity')`;
}

export function receiptFromRecord(delivery: BillingReceiptRecord): BillingReceipt {
  return {
    id: delivery.id,
    provider: delivery.provider,
    providerReference: delivery.provider_reference,
    details: delivery.details,
  };
}

async function sendReceiptDelivery(
  connection: TransactionSql,
  delivery: BillingReceiptDelivery,
  transporter: Pick<typeof billingTransporter, 'sendMail'>,
) {
  const identityReady = delivery.identity_status === 'active' && delivery.identity_email;
  const recipient =
    delivery.recipient_email || (delivery.recipient_role === 'account' ? delivery.account_email : identityReady);

  if (!recipient) {
    await connection`UPDATE billing_receipt_deliveries SET retry_at = NOW() + INTERVAL '1 hour',
      error_code = 'identity_mailbox_pending' WHERE receipt_id = ${delivery.id} AND recipient_role = ${delivery.recipient_role}`;
    return;
  }

  const duplicate = await connection`SELECT sent_at FROM billing_receipt_deliveries
    WHERE receipt_id = ${delivery.id} AND lower(recipient_email) = lower(${recipient}) AND sent_at IS NOT NULL LIMIT 1`;

  if (!duplicate[0]) {
    const message = billingReceiptEmail(receiptFromRecord(delivery), delivery.recipient_role, recipient);
    const result = await transporter.sendMail(message);
    const accepted = result.accepted?.some((address) => address.toLowerCase() === recipient.toLowerCase());

    if (!accepted || result.rejected?.length) {
      throw new Error('Receipt delivery was not accepted');
    }
  }

  await connection`UPDATE billing_receipt_deliveries SET sent_at = NOW(), recipient_email = ${recipient},
    attempts = attempts + 1, error_code = NULL WHERE receipt_id = ${delivery.id} AND recipient_role = ${delivery.recipient_role}`;
}

export async function deliverBillingReceipt(database: Sql = sql, transporter = billingTransporter) {
  return database.begin(async (connection) => {
    const rows = await connection`SELECT r.id, r.provider, r.provider_reference, r.details,
      d.recipient_role, d.recipient_email, d.attempts, u.email AS account_email,
      i.email AS identity_email, i.status AS identity_status
      FROM billing_receipt_deliveries d JOIN billing_receipts r ON r.id = d.receipt_id
      JOIN users u ON u.id = r.owner LEFT JOIN identities i ON i.id = r.identity_id
      WHERE d.sent_at IS NULL AND d.retry_at <= NOW() ORDER BY d.retry_at, r.created_at, d.recipient_role
      LIMIT 1 FOR UPDATE OF d, r SKIP LOCKED`;
    const delivery = rows[0] as BillingReceiptDelivery | undefined;

    if (!delivery) {
      return false;
    }

    try {
      await sendReceiptDelivery(connection, delivery, transporter);
    } catch {
      const delay = Math.min(
        BILLING_RECEIPT_MAX_RETRY_MS,
        BILLING_RECEIPT_RETRY_MS * 2 ** Math.min(delivery.attempts, 10),
      );

      await connection`UPDATE billing_receipt_deliveries SET retry_at = ${new Date(Date.now() + delay)},
        attempts = attempts + 1, error_code = 'delivery_unavailable'
        WHERE receipt_id = ${delivery.id} AND recipient_role = ${delivery.recipient_role}`;
    }

    return true;
  });
}

export async function processBillingReceipts() {
  for (let index = 0; index < BILLING_RECEIPT_BATCH_SIZE; index++) {
    if (!(await deliverBillingReceipt())) {
      return;
    }
  }
}

export async function recordStripeLifetimeReceipt(
  transaction: TransactionSql,
  purchase: Pick<BillingReceiptInput, 'owner' | 'identityID'>,
  payment: Stripe.PaymentIntent,
) {
  const charge = payment.latest_charge;
  const card = charge && typeof charge !== 'string' ? charge.payment_method_details?.card : null;
  const paidAt = charge && typeof charge !== 'string' ? charge.created : payment.created;

  await enqueueBillingReceipt(transaction, {
    owner: purchase.owner,
    identityID: purchase.identityID,
    provider: 'stripe',
    providerReference: payment.id,
    details: {
      identityID: purchase.identityID,
      plan: 'lifetime',
      renewal: false,
      paidAt: new Date(paidAt * 1000).toISOString(),
      amount: (payment.amount_received / 100).toFixed(2),
      currency: payment.currency.toUpperCase(),
      discount: '0.00',
      tax: null,
      periodStart: new Date(paidAt * 1000).toISOString(),
      periodEnd: null,
      paymentMethod: card ? `${card.brand} ending ${card.last4}` : 'Card via Stripe',
    },
  });
}

export async function recordStripeInvoiceReceipt(
  transaction: TransactionSql,
  purchase: Pick<BillingReceiptInput, 'owner' | 'identityID'> & {plan: BillingReceiptInput['details']['plan']},
  invoice: Stripe.Invoice,
) {
  if (invoice.status === 'paid' && invoice.currency === BILLING_CURRENCY && invoice.amount_paid > 0) {
    const period = invoice.lines.data.find((line) => line.parent?.type === 'subscription_item_details')?.period;
    const paidAt = invoice.status_transitions.paid_at || invoice.created;

    await enqueueBillingReceipt(transaction, {
      owner: purchase.owner,
      identityID: purchase.identityID,
      provider: 'stripe',
      providerReference: invoice.id,
      details: {
        identityID: purchase.identityID,
        plan: purchase.plan,
        renewal: invoice.billing_reason !== 'subscription_create',
        paidAt: new Date(paidAt * 1000).toISOString(),
        amount: (invoice.amount_paid / 100).toFixed(2),
        currency: invoice.currency.toUpperCase(),
        discount: (
          (invoice.total_discount_amounts || []).reduce((sum, discount) => sum + discount.amount, 0) / 100
        ).toFixed(2),
        tax: ((invoice.total_taxes || []).reduce((sum, tax) => sum + tax.amount, 0) / 100).toFixed(2),
        periodStart: period ? new Date(period.start * 1000).toISOString() : null,
        periodEnd: period ? new Date(period.end * 1000).toISOString() : null,
        paymentMethod: 'Card via Stripe',
        providerInvoiceNumber: invoice.number || undefined,
        providerInvoiceURL: invoice.hosted_invoice_url || undefined,
        providerInvoicePDF: invoice.invoice_pdf || undefined,
      },
    });
  }
}
