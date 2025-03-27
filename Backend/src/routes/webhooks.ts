import {sql, stripe, twilio, WSConnections} from '../connection';
import {attempt, parseMessage} from '../utils';
import {Elysia, error} from 'elysia';
import {type User} from '../types';
import {jwt} from '@elysiajs/jwt';
import twilioClient from 'twilio';

export default new Elysia()
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .post('/webhook-stripe', async ({request}) => {
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
      const result = event.data.object;
      const customer = result.customer! as string;
      const email = result.customer_details!.email! as string;
      await attempt(sql`UPDATE users SET stripe_customer = ${customer} WHERE email = ${email}`);

      const subscription = result.subscription as string;
      const intent = result.payment_intent as string;
      const date = new Date(result.created * 1000);
      const plan = result.metadata!.type;
      const id = result.metadata!.id;

      const query = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
      const owner = query[0].id;

      await attempt(sql`INSERT INTO identities (id, owner, creation_date, plan) VALUES (${id}, ${owner}, ${date}, ${plan})`);
      if (intent) await attempt(sql`UPDATE identities SET payment_intent = ${intent} WHERE creation_date = ${date}`);
      else await attempt(sql`UPDATE identities SET subscription_id = ${subscription} WHERE creation_date = ${date}`);
    }

    return {received: true};
  })
  .post('/webhook-twilio', async ({body, request}) => {
    const website = request.headers.get('X-Forwarded-Proto') + '://' + request.headers.get('X-Forwarded-Host');
    const url = `${website}/webhook-twilio`;

    const signature = request.headers.get('X-Twilio-Signature') || '';
    const rawBody = body as {[key: string]: string};
    const auth = process.env.TWILIO_TOKEN!;

    if (!twilioClient.validateRequest(auth, signature, url, rawBody)) {
      return error(400, 'Invalid signature');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const rawMessage = await twilio.messages.get(rawBody.MessageSid).fetch();
    const message = parseMessage(rawMessage);

    const ws = WSConnections.find((ws) => ws.phoneNumber === message.to);
    if (!ws) return;

    ws?.websocket.send(JSON.stringify({type: 'new-message', newMessage: message}));
  });
