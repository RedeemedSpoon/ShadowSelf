import {toTitleCase, error, proxyRequest} from '@utils/utils';
import {sql, stripe, origin, twilio} from '@utils/connection';
import {generateIdentityID} from '@utils/cryptography';
import type {QueryIdentity, QueryUser} from '@types';
import {pricingModal, pricingTable} from '@types';
import middleware from '@middleware';
import {check} from '@utils/checks';
import {Elysia} from 'elysia';
import Stripe from 'stripe';
import {$} from 'bun';

export default new Elysia({prefix: '/billing'})
  .use(middleware)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(9);
    const mustLogIn = ['/checkout', '/checkout-after-confirm'];

    if (mustLogIn.some((p) => relativePath === p || relativePath === p + '/') && !user) {
      return error(set, 401, 'You are not logged in');
    }
  })
  .post('/portal', async ({set, body}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(set, 400, err);

    const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${email}`) as QueryUser[];
    if (!customer[0].stripe_customer) return {sessionUrl: ''};

    const hasPaymentMethod = await stripe.paymentMethods.list({customer: customer[0].stripe_customer, type: 'card'});
    if (!hasPaymentMethod.data.length) return {sessionUrl: ''};

    const session = await stripe.billingPortal.sessions.create({
      configuration: 'bpc_1QjGV8ByRGrIIrNdbBoPD90b',
      customer: customer[0].stripe_customer,
      return_url: `${origin}/settings`,
    });

    return {sessionUrl: session.url};
  })
  .get('/checkout', async ({set, user, query}) => {
    const type = query?.type as keyof typeof pricingModal;
    const identityID = generateIdentityID();

    if (!type) return error(set, 400, 'Missing or invalid query type. Try again');
    if (!pricingModal[type]) return error(set, 400, 'Invalid query type. Try again');

    const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const customerID = customer[0]?.stripe_customer;

    const request = (await stripe.customers.retrieve(customerID)) as Stripe.Customer;
    const paymentMethodsID =
      typeof request.invoice_settings?.default_payment_method === 'string'
        ? request.invoice_settings.default_payment_method
        : request.invoice_settings?.default_payment_method?.id;

    if (paymentMethodsID) {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodsID);
      const cardName = toTitleCase(paymentMethod.card?.brand as string);
      const last4 = paymentMethod.card?.last4;

      return {step: 'confirm', cardName, last4};
    }

    const metadata = {id: identityID, type};
    let clientSecret = '';

    if (type === 'lifetime') {
      const paymentIntent = await stripe.paymentIntents.create({
        metadata,
        customer: customerID,
        amount: pricingTable.lifetime,
        payment_method_types: ['card'],
        currency: 'eur',
      });

      clientSecret = paymentIntent.client_secret!;
    } else {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        metadata,
        customer: customerID,
        items: [{price: pricingModal[type]}],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
      };

      const subscription = await stripe.subscriptions.create(subscriptionParams);
      const latestInvoiceID =
        typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id;

      if (latestInvoiceID) {
        const payments = await stripe.invoicePayments.list({
          invoice: latestInvoiceID,
          limit: 1,
          expand: ['data.payment.payment_intent'],
        });

        const piObj = payments.data[0]?.payment?.payment_intent as Stripe.PaymentIntent;
        clientSecret = piObj?.client_secret || '';
      }
    }

    return {step: 'create', clientSecret, identityID};
  })
  .get('/checkout-after-confirm', async ({set, user, query}) => {
    const type = query?.type as keyof typeof pricingModal;
    const identityID = generateIdentityID();

    if (!type) return error(set, 400, 'Missing or invalid query type. Try again');
    if (!pricingModal[type]) return error(set, 400, 'Invalid query type. Try again');

    const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const customerID = customer[0]?.stripe_customer;

    const request = (await stripe.customers.retrieve(customerID)) as Stripe.Customer;
    const paymentMethodsID =
      typeof request.invoice_settings?.default_payment_method === 'string'
        ? request.invoice_settings.default_payment_method
        : request.invoice_settings?.default_payment_method?.id;

    const metadata = {id: identityID, type};
    let paymentIntentID = '';

    if (type === 'lifetime') {
      paymentIntentID = (
        await stripe.paymentIntents.create({
          metadata,
          customer: customerID,
          amount: pricingTable.lifetime,
          payment_method_types: ['card'],
          payment_method: paymentMethodsID,
          currency: 'eur',
          confirm: false,
        })
      ).id;
    } else {
      const subscription = await stripe.subscriptions.create({
        metadata,
        customer: customerID,
        items: [{price: pricingModal[type]}],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
      });

      const latestInvoiceID =
        typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id;

      if (latestInvoiceID) {
        const payments = await stripe.invoicePayments.list({invoice: latestInvoiceID, limit: 1});
        const piObj = payments.data[0]?.payment?.payment_intent;
        paymentIntentID = typeof piObj === 'string' ? piObj : piObj!.id;
      }
    }

    await stripe.paymentIntents.confirm(paymentIntentID, {
      payment_method_options: {card: {request_three_d_secure: 'automatic'}},
    });

    const result = await stripe.paymentIntents.retrieve(paymentIntentID);
    const clientSecret = result.client_secret;
    const status = result.status;

    if (status === 'requires_payment_method') return error(set, 400, 'Something went wrong. Please try again.');
    else if (status === 'requires_action') return {step: 'auth', clientSecret, identityID};
    else if (status === 'succeeded') return {step: 'finish', identityID};
  })
  .delete('/cancel', async ({set, body}) => {
    const {err, id} = check(body, ['id']);
    if (err) return error(set, 400, err);

    const identity = (await sql`SELECT * FROM identities WHERE id = ${id}`)?.[0] as QueryIdentity;
    if (!identity) return error(set, 404, 'Identity not found');

    const intent = identity.payment_intent;
    const subscription = identity.subscription_id;

    const date = identity.creation_date;
    const difference = new Date().getTime() - new Date(date).getTime();
    const differenceInDays = difference / (1000 * 3600 * 24);

    try {
      if (differenceInDays <= 14) {
        if (intent) {
          await stripe.refunds.create({payment_intent: intent});
        } else if (subscription) {
          const invoices = await stripe.invoices.list({subscription: subscription, limit: 1});
          const invoiceObj = invoices.data[0];

          if (invoiceObj) {
            const payments = await stripe.invoicePayments.list({invoice: invoiceObj.id, limit: 1});
            const piObj = payments.data[0]?.payment?.payment_intent;
            const finalPiID = typeof piObj === 'string' ? piObj : piObj?.id;

            if (finalPiID) {
              await stripe.refunds.create({payment_intent: finalPiID});
            }
          }
        }
      }

      if (subscription) {
        const result = await stripe.subscriptions.retrieve(subscription);
        if (result.status !== 'canceled') await stripe.subscriptions.cancel(subscription);
      }
    } catch (_) {}

    const username = identity.email.split('@')[0];
    await $`userdel -r ${username}`.nothrow().quiet();
    await twilio
      .incomingPhoneNumbers(identity.phone)
      .remove()
      .catch(() => {});

    const country = identity.location.split(', ')[0].toLowerCase();
    await proxyRequest(country, 'DELETE', {username: identity.id}).catch(() => {});

    await sql`DELETE FROM accounts WHERE owner = ${identity.id}`;
    await sql`DELETE FROM identities WHERE id = ${identity.id}`;

    return {success: true};
  })
  .group('/customer', (app) =>
    app
      .post('/', async ({set, body}) => {
        const {email, payment, err} = check(body, ['email', '?payment']);
        if (err) return error(set, 400, err);

        const object = payment ? {email, payment_method: payment, invoice_settings: {default_payment_method: payment}} : {email};
        const customer = await stripe.customers.create(object);

        if (payment) await stripe.paymentMethods.update(payment, {allow_redisplay: 'always'});
        await sql`UPDATE users SET stripe_customer = ${customer.id} WHERE email = ${email}`;
      })
      .put('/', async ({set, body}) => {
        const {email, payment, err} = check(body, ['email']);
        if (err) return error(set, 400, err);

        const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${email}`) as QueryUser[];
        await stripe.paymentMethods.attach(payment, {customer: customer[0]?.stripe_customer});
        await stripe.customers.update(customer[0]?.stripe_customer, {invoice_settings: {default_payment_method: payment}});
      })
      .patch('/', async ({set, body}) => {
        const {email, err} = check(body, ['email']);
        if (err) return error(set, 400, err);

        const oldEmail = (body as any)?.oldEmail;
        const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${oldEmail}`) as QueryUser[];
        const id = customer[0]?.stripe_customer || '';

        if (id) await stripe.customers.update(id, {email});
      })
      .delete('/', async ({set, body}) => {
        const {email, err} = check(body, ['email']);
        if (err) return error(set, 400, err);

        const customer = (await sql`SELECT stripe_customer FROM users WHERE email = ${email}`) as QueryUser[];
        const id = customer[0]?.stripe_customer || '';

        if (id) await stripe.customers.del(customer[0].stripe_customer);
      }),
  );
