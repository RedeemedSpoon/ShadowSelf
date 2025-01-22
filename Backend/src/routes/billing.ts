import {type User, pricingModal} from '../types';
import {sql, stripe} from '../connection';
import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {check} from '../checks';

export default new Elysia({prefix: '/billing'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .post('/webhook', async ({request}) => {
    const signature = request.headers.get('stripe-signature')!;
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const body = await request.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (err) {
      return error(400, err instanceof Error ? err.message : err);
    }

    if (event.type === 'checkout.session.completed') {
      const customer = event.data.object.customer! as string;
      const email = event.data.object.customer_details!.email! as string;
      await attempt(sql`UPDATE users SET stripe_customer = ${customer} WHERE email = ${email}`);

      const owner = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
      const paymentIntent = event.data.object.payment_intent as string;
      const creationTime = event.data.object.created as number;

      await attempt(
        sql`INSERT INTO identities (owner, creation_time, payment_intent) VALUES (${owner[0].id}, ${creationTime}, ${paymentIntent})`,
      );
    }

    return {received: true};
  })
  .post('/setup', async ({body}) => {
    const {email, payment, err} = check(body, ['email', 'payment']);
    if (err) return error(400, err);

    const customer = await stripe.customers.create({email, payment_method: payment});
    await stripe.paymentMethods.update(payment, {allow_redisplay: 'always'});
    await attempt(sql`UPDATE users SET stripe_customer = ${customer.id} WHERE email = ${email}`);
  })
  .post('/email', async ({body}: {body: {oldEmail: string; email: string}}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(400, err);

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${body?.oldEmail}`);
    const id = customer[0]?.stripe_customer || '';

    if (id) await stripe.customers.update(id, {email});
  })
  .post('/portal', async ({body}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(400, err);

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${email}`);
    if (!customer[0].stripe_customer) return {sessionUrl: ''};

    const session = await stripe.billingPortal.sessions.create({
      customer: customer[0].stripe_customer,
      return_url: 'https://shadowself.io/dashboard',
    });

    return {sessionUrl: session.url};
  })
  .delete('/delete', async ({body}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(400, err);

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${email}`);
    const id = customer[0]?.stripe_customer || '';

    if (id) await stripe.customers.del(customer[0].stripe_customer);
  })
  .get('/checkout', async ({user, query}) => {
    if (!user) return error(401, 'You are not logged in');

    let option;
    const runtime = process.env.NODE_ENV;
    const type = query?.type as keyof typeof pricingModal;
    const origin = runtime === 'dev' ? 'http://localhost:5173' : 'https://shadowself.io';

    if (!type) return error(400, 'Missing or invalid query type. Try again');
    if (!pricingModal[type]) return error(400, 'Invalid query type. Try again');

    const customer = await attempt(sql`SELECT stripe_customer FROM users WHERE email = ${user.email}`);
    const customerId = customer[0]?.stripe_customer;

    if (customerId) {
      option = {
        customer: customerId,
        ui_mode: 'custom',
        return_url: `${origin}/dashboard`,
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
        return_url: `${origin}/dashboard`,
        mode: type === 'lifetime' ? 'payment' : 'subscription',
        line_items: [{price: pricingModal[type], quantity: 1}],
      };
    }

    // @ts-expect-error Stripe smh...
    const session = await stripe.checkout.sessions.create(option);
    return {clientSecret: session.client_secret};
  });
