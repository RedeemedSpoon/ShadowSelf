import {processStripeEvent} from '@core/stripe-service';
import {error, parseMessage} from '@utils/utils';
import middlewareBase from '@middlewares/middleware-base';
import {stripeConfig, twilioConfig, origin} from '@core/config';
import {sql, stripe, twilio} from '@core/services';
import {wsConnections} from '@core/states';
import twilioClient from 'twilio';
import type Stripe from 'stripe';
import {Elysia} from 'elysia';

export default new Elysia()
  .use(middlewareBase)
  .post('/webhook-stripe', async ({set, request}) => {
    const signature = request.headers.get('stripe-signature')!;
    const secret = stripeConfig.webhookSecret;
    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (err) {
      return error(set, 400, err instanceof Error ? err.message : (err as string));
    }

    await sql`INSERT INTO stripe_events (id, payload) VALUES (${event.id}, ${sql.json(JSON.parse(JSON.stringify(event)))}) ON CONFLICT DO NOTHING`;
    void processStripeEvent(event.id).catch(() => console.error('Stripe event saved for reconciliation'));

    return {received: true};
  })
  .post('/webhook-twilio', async ({set, body, request}) => {
    const url = `${origin}/webhook-twilio`;

    const signature = request.headers.get('X-Twilio-Signature') || '';
    const rawBody = body as {[key: string]: string};
    const auth = twilioConfig.token;

    if (!twilioClient.validateRequest(auth, signature, url, rawBody)) {
      return error(set, 400, 'Invalid signature');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const rawMessage = await twilio.messages.get(rawBody.MessageSid).fetch();
    const message = parseMessage(rawMessage);

    const sockets = wsConnections.values().filter((ws) => ws.phoneNumber === message.to);
    for (const ws of sockets) {
      if (await ws.authorize()) ws.websocket.send(JSON.stringify({type: 'message', message}));
    }
  });
