import {type User, pricingModal} from '../types';
import {Elysia, error} from 'elysia';
import {sql, stripe} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';

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
      const username = event.data.object.customer_details?.name as string;
      await attempt(sql`UPDATE users SET stripe_customer = ${customer} WHERE username = ${username}`);
    }

    return {received: true};
  })
  .get('/', async ({user, query}) => {
    if (!user) return error(401, 'You are not logged in');

    const runtime = process.env.NODE_ENV;
    const type = query?.type as keyof typeof pricingModal;
    const origin = runtime === 'dev' ? 'http://localhost:5173' : 'https://shadowself.io';

    if (!type) return error(400, 'Missing or invalid query type. Try again');
    if (!pricingModal[type]) return error(400, 'Invalid query type. Try again');

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'custom' as 'embedded',
      return_url: `${origin}/dashboard`,
      mode: type === 'lifetime' ? 'payment' : 'subscription',
      line_items: [{price: pricingModal[type], quantity: 1}],
      payment_method_types: ['card'],
    });

    return {clientSecret: session.client_secret};
  });
