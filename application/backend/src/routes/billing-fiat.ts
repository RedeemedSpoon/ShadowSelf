import {IDENTITY_CREATION_AVAILABLE} from '@core/constants';
import {createBillingCustomer} from '@core/stripe-service';
import {withAccountLock} from '@core/identity-service';
import middlewareBase from '@middlewares/middleware-base';
import {generateIdentityID} from '@utils/cryptography';
import {sql, stripe} from '@core/services';
import {stripeConfig, origin} from '@core/config';
import {PRICING_TIERS, BILLING_CURRENCY, UUID_PATTERN} from '@core/constants';
import {error, toTitleCase} from '@utils/utils';
import type Stripe from 'stripe';
import {Elysia} from 'elysia';
import {ApiError, requireProvider} from '@core/security';
import type {ReservedSql} from 'postgres';

export default new Elysia({prefix: '/api/billing'})
  .use(middlewareBase)
  .guard({authenticated: true})
  .get('/availability', () => ({creationAvailable: IDENTITY_CREATION_AVAILABLE}))
  .post('/checkout', ({set, user, body}) => checkout(set, user.email, body, false))
  .post('/checkout/confirm', ({set, user, body}) => checkout(set, user.email, body, true));

export async function checkout(
  set: Record<string, any>,
  email: string,
  body: unknown,
  confirm: boolean,
  provider: Stripe = stripe,
) {
  requireProvider(IDENTITY_CREATION_AVAILABLE, 'New identity purchases');

  const input = body as {plan?: string; requestID?: string};

  if (
    !input ||
    !input.plan ||
    !Object.hasOwn(stripeConfig.prices, input.plan) ||
    !UUID_PATTERN.test(input.requestID || '')
  ) {
    return error(set, 400, 'A valid plan and payment request ID are required');
  }

  const type = input.plan as keyof typeof stripeConfig.prices;

  if (type !== 'lifetime') {
    const price = await provider.prices.retrieve(stripeConfig.prices[type]);

    const interval = type === 'monthly' ? 'month' : 'year';

    if (
      !price.active ||
      price.currency !== BILLING_CURRENCY ||
      price.unit_amount !== PRICING_TIERS[type] ||
      price.recurring?.interval !== interval ||
      price.recurring.interval_count !== 1
    ) {
      throw new ApiError(503, 'billing_configuration', 'The configured billing price does not match this plan');
    }
  }

  const accounts = await sql`SELECT id FROM users WHERE email = ${email}`;

  if (!accounts.length) {
    return error(set, 401, 'Sign in to continue');
  }

  const owner = accounts[0].id;

  return withAccountLock(owner, async (connection) => {
    const customerID = await createBillingCustomer(email, undefined, provider, connection);

    await connection`INSERT INTO fiat_intents (request_id, owner, plan, identity_id)
      VALUES (${input.requestID!}, ${owner}, ${type}, ${generateIdentityID()}) ON CONFLICT (owner, request_id) DO NOTHING`;

    const intents =
      await connection`SELECT * FROM fiat_intents WHERE owner = ${owner} AND request_id = ${input.requestID!}`;

    const intent = intents[0];

    if (intent.plan !== type) {
      return error(set, 409, 'This payment request already has a different plan');
    }

    if (intent.response?.step === 'finish') {
      return intent.response;
    }

    if (
      !intent.provider_id &&
      !intent.subscription_id &&
      Date.now() - new Date(intent.created_at).getTime() >= 23 * 60 * 60_000
    ) {
      return error(set, 409, 'Payment request needs reconciliation. Do not start another payment');
    }

    const customer = (await provider.customers.retrieve(customerID)) as Stripe.Customer;

    const reference = customer.invoice_settings?.default_payment_method;
    const paymentMethod = typeof reference === 'string' ? reference : reference?.id;

    if (!confirm && paymentMethod && !intent.provider_id) {
      const method = await provider.paymentMethods.retrieve(paymentMethod);

      const response = {
        step: 'confirm',
        cardName: toTitleCase(method.card?.brand || 'card'),
        last4: method.card?.last4,
        identityID: intent.identity_id,
      };
      await connection`UPDATE fiat_intents SET response = ${connection.json(response)} WHERE id = ${intent.id}`;

      return response;
    }

    const response = await createStripePayment(intent, customerID, paymentMethod, confirm, connection, provider);
    await connection`UPDATE fiat_intents SET response = ${connection.json(response)}, provider_id = ${response.providerID} WHERE id = ${intent.id}`;

    return response;
  });
}

async function createStripePayment(
  intent: Record<string, any>,
  customer: string,
  paymentMethod: string | undefined,
  confirm: boolean,
  connection: ReservedSql,
  provider: Stripe,
) {
  const metadata = {id: intent.identity_id, type: intent.plan};
  const idempotencyKey = `checkout:${intent.id}`;
  let payment: Stripe.PaymentIntent;

  if (intent.provider_id) {
    payment = await provider.paymentIntents.retrieve(intent.provider_id);
  } else {
    if (intent.plan === 'lifetime') {
      payment = await provider.paymentIntents.create(
        {
          metadata,
          customer,
          amount: PRICING_TIERS.lifetime,
          currency: BILLING_CURRENCY,
          payment_method_types: ['card'],
        },
        {idempotencyKey},
      );
    } else {
      const subscription = intent.subscription_id
        ? await provider.subscriptions.retrieve(intent.subscription_id)
        : await provider.subscriptions.create(
            {
              metadata,
              customer,
              items: [{price: stripeConfig.prices[intent.plan as 'monthly' | 'annually']}],
              payment_behavior: 'default_incomplete',
              payment_settings: {save_default_payment_method: 'on_subscription', payment_method_types: ['card']},
            },
            {idempotencyKey},
          );
      await connection`UPDATE fiat_intents SET subscription_id = ${subscription.id} WHERE id = ${intent.id}`;

      const invoiceID =
        typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id;

      if (!invoiceID) {
        throw new Error('Stripe invoice is not available yet');
      }

      const payments = await provider.invoicePayments.list({
        invoice: invoiceID,
        limit: 1,
        expand: ['data.payment.payment_intent'],
      });

      const reference = payments.data[0]?.payment.payment_intent;

      if (!reference) {
        throw new Error('Stripe payment is not available yet');
      }

      payment = typeof reference === 'string' ? await provider.paymentIntents.retrieve(reference) : reference;
    }
  }

  await connection`UPDATE fiat_intents SET provider_id = ${payment.id} WHERE id = ${intent.id}`;

  if (confirm && paymentMethod && ['requires_payment_method', 'requires_confirmation'].includes(payment.status)) {
    payment = await provider.paymentIntents.confirm(
      payment.id,
      {payment_method: paymentMethod, return_url: `${origin}/dashboard`},
      {idempotencyKey: `confirm:${intent.id}`},
    );
  }

  const step = payment.status === 'succeeded' ? 'finish' : payment.status === 'requires_action' ? 'auth' : 'create';

  return {step, clientSecret: payment.client_secret, identityID: intent.identity_id, providerID: payment.id};
}
