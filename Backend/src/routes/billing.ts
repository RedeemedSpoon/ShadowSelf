import {sql, stripe, origin, twilio} from '@utils/connection';
import {pricingModal, pricingTable} from '@types';
import {generateIdentityID} from '@utils/crypto';
import {Elysia, error} from 'elysia';
import middleware from '@middleware';
import {attempt} from '@utils/utils';
import {check} from '@utils/checks';
import Stripe from 'stripe';
import {$} from 'bun';

export default new Elysia({prefix: '/billing'})
  .use(middleware)
  .post('/portal', async ({body}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(400, err);

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${email}`);
    if (!customer[0].stripe_customer) return {sessionUrl: ''};

    const session = await stripe.billingPortal.sessions.create({
      customer: customer[0].stripe_customer,
      return_url: `${origin}/settings`,
    });

    return {sessionUrl: session.url};
  })
  .get('/checkout', async ({user, query}) => {
    if (!user) return error(401, 'You are not logged in');

    const type = query?.type as keyof typeof pricingModal;
    const identityID = generateIdentityID();

    if (!type) return error(400, 'Missing or invalid query type. Try again');
    if (!pricingModal[type]) return error(400, 'Invalid query type. Try again');

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${user.email}`);
    const customerId = customer[0]?.stripe_customer;

    const paymentMethodResponse = await stripe.customers.retrieve(customerId as string);
    const paymentMethod = (paymentMethodResponse as Stripe.Customer).invoice_settings.default_payment_method as string;

    const metadata = {id: identityID, type};
    let clientSecret = '';

    if (type === 'lifetime') {
      const paymentIntent = await stripe.paymentIntents.create({
        metadata,
        customer: customerId,
        amount: pricingTable.lifetime,
        payment_method: paymentMethod,
        payment_method_types: ['card'],
        currency: 'eur',
      });

      console.log(paymentIntent.status);
      clientSecret = paymentIntent.client_secret!;
    } else {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        metadata,
        customer: customerId,
        items: [{price: pricingModal[type]}],
        payment_behavior: 'default_incomplete',
        default_payment_method: paymentMethod,
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
      };

      const subscription = await stripe.subscriptions.create(subscriptionParams);
      clientSecret = ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent).client_secret!;
    }

    return {clientSecret, identityID};
  })
  .delete('/cancel', async ({body}) => {
    const {err, id} = check(body, ['id']);
    if (err) return error(400, err);

    const identity = (await attempt(sql`SELECT * FROM identities WHERE id = ${id}`))?.[0] || null;
    if (!identity) return error(404, 'Identity not found');

    const intent = identity.payment_intent;
    const subscription = identity.subscription_id;

    const date = identity.creation_date;
    const difference = new Date().getTime() - new Date(date).getTime();
    const differenceInDays = difference / (1000 * 3600 * 24);

    if (differenceInDays <= 14) {
      if (intent) await stripe.refunds.create({payment_intent: intent});
      else {
        const invoices = await stripe.invoices.list({subscription: subscription, limit: 1});
        await stripe.refunds.create({payment_intent: invoices.data[0]?.payment_intent?.toString()});
      }
    }

    if (subscription) {
      const result = await stripe.subscriptions.retrieve(subscription);
      if (result.status !== 'canceled') await stripe.subscriptions.cancel(subscription);
    }

    const username = identity.email.split('@')[0];
    await $`userdel -r ${username}`.nothrow().quiet();
    await twilio.incomingPhoneNumbers(identity.phone).remove();

    await attempt(sql`DELETE FROM accounts WHERE owner = ${identity.id}`);
    await attempt(sql`DELETE FROM identities WHERE id = ${identity.id}`);
    return {success: true};
  })
  .group('/customer', (app) =>
    app
      .post('/', async ({body}) => {
        const {email, payment, err} = check(body, ['email', 'payment']);
        if (err) return error(400, err);

        const customer = await stripe.customers.create({email, payment_method: payment});
        await stripe.paymentMethods.update(payment, {allow_redisplay: 'always'});
        await attempt(sql`UPDATE users SET stripe_customer = ${customer.id} WHERE email = ${email}`);
      })
      .put('/', async ({body}: {body: {oldEmail: string; email: string}}) => {
        const {email, err} = check(body, ['email']);
        if (err) return error(400, err);

        const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${body?.oldEmail}`);
        const id = customer[0]?.stripe_customer || '';

        if (id) await stripe.customers.update(id, {email});
      })
      .delete('/', async ({body}) => {
        const {email, err} = check(body, ['email']);
        if (err) return error(400, err);

        const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${email}`);
        const id = customer[0]?.stripe_customer || '';

        if (id) await stripe.customers.del(customer[0].stripe_customer);
      }),
  );
