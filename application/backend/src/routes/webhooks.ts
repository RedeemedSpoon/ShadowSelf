import {processStripeEvent} from '@core/stripe-service';
import {error, parseMessage} from '@utils/utils';
import {stripeConfig, twilioConfig, origin} from '@core/config';
import {requireProvider} from '@core/security';
import {sql, stripe, getPhoneClient} from '@core/services';
import {wsConnections} from '@core/states';
import twilioClient from 'twilio';
import type Stripe from 'stripe';
import {Elysia} from 'elysia';

export default new Elysia()
  .post(
    '/api/webhooks/stripe',
    async ({set, body, request}) => {
      requireProvider(!!stripeConfig.secretKey && !!stripeConfig.webhookSecret, 'Card billing webhooks');

      const signature = request.headers.get('stripe-signature') || '';
      let event: Stripe.Event;

      try {
        event = await stripe.webhooks.constructEventAsync(body as string, signature, stripeConfig.webhookSecret);
      } catch {
        return error(set, 400, 'Invalid Stripe signature');
      }

      await sql`INSERT INTO stripe_events (id, payload) VALUES (${event.id}, ${sql.json(JSON.parse(JSON.stringify(event)))}) ON CONFLICT DO NOTHING`;
      void processStripeEvent(event.id).catch(() => console.error('Stripe event saved for reconciliation'));

      return {received: true};
    },
    {parse: 'text'},
  )
  .post('/api/webhooks/twilio', async ({set, body, request}) => {
    requireProvider(!!twilioConfig.token, 'Phone webhooks');

    const signature = request.headers.get('X-Twilio-Signature') || '';
    const fields = body as Record<string, string>;
    const url = `${origin}/api/webhooks/twilio`;

    if (!fields || !twilioClient.validateRequest(twilioConfig.token, signature, url, fields)) {
      return error(set, 400, 'Invalid Twilio signature');
    }

    if (!/^SM[a-f0-9]{32}$/i.test(fields.MessageSid || '')) {
      return error(set, 400, 'Invalid message reference');
    }

    const message = parseMessage(await getPhoneClient().messages(fields.MessageSid).fetch());

    for (const connection of wsConnections.values().filter((item) => item.phoneNumber === message.to)) {
      if (await connection.authorize()) {
        connection.websocket.send(JSON.stringify({type: 'message', message}));
      }
    }

    set.headers['content-type'] = 'text/xml';

    return '<Response></Response>';
  });
