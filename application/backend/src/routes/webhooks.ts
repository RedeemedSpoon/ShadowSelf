import {processStripeEvent} from '@core/stripe-service';
import {error} from '@utils/utils';
import {stripeConfig} from '@core/config';
import {requireProvider} from '@core/security';
import {sql, stripe} from '@core/services';
import type Stripe from 'stripe';
import {Elysia} from 'elysia';

export default new Elysia().post(
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
);
