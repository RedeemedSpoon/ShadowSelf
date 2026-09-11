import middlewareBase from '@middlewares/middleware-base';
import {generateIdentityID} from '@utils/cryptography';
import {createBillingCustomer, sql, stripe} from '@core/services';
import {stripeConfig, origin} from '@core/config';
import {PRICING_TIERS} from '@core/constants';
import {error, toTitleCase} from '@utils/utils';
import type Stripe from 'stripe';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/fiat'})
  .use(middlewareBase)
  .post('/checkout', ({set, user, body}) => checkout(set, user?.email, body, false))
  .post('/checkout-after-confirm', ({set, user, body}) => checkout(set, user?.email, body, true));

async function checkout(set: Record<string, any>, email: string | undefined, body: unknown, confirm: boolean) {
  if (!email) return error(set, 401, 'You are not logged in');
  const input = body as {type?: string; requestID?: string};
  if (!input || !input.type || !Object.hasOwn(stripeConfig.prices, input.type) || !/^[a-f0-9-]{36}$/.test(input.requestID || '')) {
    return error(set, 400, 'A valid plan and payment request ID are required');
  }

  const type = input.type as keyof typeof stripeConfig.prices;
  const customerID = await createBillingCustomer(email);
  const accounts = await sql`SELECT id FROM users WHERE email = ${email}`;
  const owner = accounts[0].id;
  await sql`INSERT INTO fiat_intents (request_id, owner, plan, identity_id)
    VALUES (${input.requestID!}, ${owner}, ${type}, ${generateIdentityID()}) ON CONFLICT (owner, request_id) DO NOTHING`;
  const connection = await sql.reserve();

  try {
    await connection`SELECT pg_advisory_lock(hashtextextended(${`${owner}:${input.requestID}`}, 0))`;
    const intents = await connection`SELECT * FROM fiat_intents WHERE owner = ${owner} AND request_id = ${input.requestID!}`;
    const intent = intents[0];
    if (intent.plan !== type) return error(set, 409, 'This payment request already has a different plan');
    if (intent.response && (!confirm || intent.response.step !== 'confirm')) return intent.response;

    const customer = (await stripe.customers.retrieve(customerID)) as Stripe.Customer;
    const reference = customer.invoice_settings?.default_payment_method;
    const paymentMethod = typeof reference === 'string' ? reference : reference?.id;
    if (!confirm && paymentMethod && !intent.provider_id) {
      const method = await stripe.paymentMethods.retrieve(paymentMethod);
      const response = {step: 'confirm', cardName: toTitleCase(method.card?.brand || 'card'), last4: method.card?.last4, identityID: intent.identity_id};
      await connection`UPDATE fiat_intents SET response = ${connection.json(response)} WHERE id = ${intent.id}`;
      return response;
    }

    const response = await createStripePayment(intent, customerID, paymentMethod, confirm);
    await connection`UPDATE fiat_intents SET response = ${connection.json(response)}, provider_id = ${response.providerID} WHERE id = ${intent.id}`;

    return response;
  } finally {
    await connection`SELECT pg_advisory_unlock(hashtextextended(${`${owner}:${input.requestID}`}, 0))`;
    connection.release();
  }
}

async function createStripePayment(intent: Record<string, any>, customer: string, paymentMethod: string | undefined, confirm: boolean) {
  const metadata = {id: intent.identity_id, type: intent.plan};
  const idempotencyKey = `checkout:${intent.id}`;
  let payment: Stripe.PaymentIntent;

  if (intent.plan === 'lifetime') {
    payment = await stripe.paymentIntents.create(
      {
        metadata,
        customer,
        amount: PRICING_TIERS.lifetime,
        currency: 'eur',
        payment_method_types: ['card'],
        ...(confirm && paymentMethod ? {payment_method: paymentMethod} : {}),
      },
      {idempotencyKey},
    );
  } else {
    const subscription = await stripe.subscriptions.create(
      {
        metadata,
        customer,
        items: [{price: stripeConfig.prices[intent.plan as 'monthly' | 'annually']}],
        payment_behavior: 'default_incomplete',
        payment_settings: {save_default_payment_method: 'on_subscription', payment_method_types: ['card']},
      },
      {idempotencyKey},
    );
    const invoiceID = typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id;
    if (!invoiceID) throw new Error('Stripe invoice is not available yet');
    const payments = await stripe.invoicePayments.list({invoice: invoiceID, limit: 1, expand: ['data.payment.payment_intent']});
    const reference = payments.data[0]?.payment.payment_intent;
    if (!reference) throw new Error('Stripe payment is not available yet');
    payment = typeof reference === 'string' ? await stripe.paymentIntents.retrieve(reference) : reference;
  }

  if (confirm && paymentMethod && ['requires_payment_method', 'requires_confirmation'].includes(payment.status)) {
    payment = await stripe.paymentIntents.confirm(
      payment.id,
      {payment_method: paymentMethod, return_url: `${origin}/dashboard`},
      {idempotencyKey: `confirm:${intent.id}`},
    );
  }
  const step = payment.status === 'succeeded' ? 'finish' : payment.status === 'requires_action' ? 'auth' : 'create';

  return {step, clientSecret: payment.client_secret, identityID: intent.identity_id, providerID: payment.id};
}
