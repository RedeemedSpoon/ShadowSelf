import {sql, stripe, origin} from '@utils/connection';
import {QueryResult, pricingModal} from '@types';
import {generateIdentityID} from '@utils/crypto';
import {Elysia, error} from 'elysia';
import middleware from '@middleware';
import {attempt} from '@utils/utils';
import {check} from '@utils/checks';

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
    let option;

    if (!type) return error(400, 'Missing or invalid query type. Try again');
    if (!pricingModal[type]) return error(400, 'Invalid query type. Try again');

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${user.email}`);
    const customerId = customer[0]?.stripe_customer;

    if (customerId) {
      option = {
        customer: customerId,
        ui_mode: 'custom',
        metadata: {id: identityID, type},
        return_url: `${origin}/create?id=${identityID}`,
        mode: type === 'lifetime' ? 'payment' : 'subscription',
        line_items: [{price: pricingModal[type], quantity: 1}],
        saved_payment_method_options: {
          payment_method_save: 'enabled',
          allow_redisplay_filters: ['always'],
        },
      };
    } else {
      option = {
        customer_email: user.email,
        ui_mode: 'custom',
        metadata: {id: identityID, type},
        return_url: `${origin}/create?id=${identityID}`,
        mode: type === 'lifetime' ? 'payment' : 'subscription',
        line_items: [{price: pricingModal[type], quantity: 1}],
      };
    }

    // @ts-expect-error Stripe smh...
    const session = await stripe.checkout.sessions.create(option);
    return {clientSecret: session.client_secret};
  })
  .delete('/cancel', async ({body, user}) => {
    if (!user) return error(401, 'You are not logged in');

    const {subscription, intent, err} = check(body, ['?subscription', '?intent']);
    if (err) return error(400, err);

    let identity: QueryResult[];
    const result = await attempt(sql`SELECT id FROM users WHERE email = ${user.email}`);
    const owner = result[0].id;

    if (intent) identity = await attempt(sql`SELECT * FROM identities WHERE payment_intent = ${intent || 'nothing'}`);
    else identity = await attempt(sql`SELECT * FROM identities WHERE subscription_id = ${subscription || 'nothing'}`);

    if (!identity[0]?.owner) return error(400, 'Subscription not found. Please try again');
    if (identity[0]?.owner !== owner) return error(400, 'Subscription not found. Please try again');
    if (subscription) await stripe.subscriptions.cancel(subscription);

    const date = identity[0].creation_date;
    const difference = new Date().getTime() - new Date(date).getTime();
    const differenceInDays = difference / (1000 * 3600 * 24);

    if (differenceInDays <= 14) {
      if (intent) await stripe.refunds.create({payment_intent: intent});
      else {
        const invoices = await stripe.invoices.list({subscription: subscription, limit: 1});
        await stripe.refunds.create({payment_intent: invoices.data[0]?.payment_intent?.toString()});
      }
    }

    await attempt(sql`DELETE FROM identities WHERE id = ${identity[0].id}`);
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
