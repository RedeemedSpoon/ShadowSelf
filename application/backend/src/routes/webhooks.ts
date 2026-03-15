import {sql, stripe, twilio, WSConnections} from '@utils/connection';
import {error, parseMessage, request as req} from '@utils/utils';
import {QueryIdentity, QueryUser} from '@types';
import middleware from '@middleware';
import twilioClient from 'twilio';
import {Elysia} from 'elysia';
import Stripe from 'stripe';

export default new Elysia()
  .use(middleware)
  .post('/webhook-stripe', async ({set, request}) => {
    const signature = request.headers.get('stripe-signature')!;
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (err) {
      return error(set, 400, err instanceof Error ? err.message : (err as string));
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      if (!paymentIntent.metadata?.invoice && paymentIntent.metadata?.id && paymentIntent.metadata?.type) {
        const customerID = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id;
        const intentID = paymentIntent.id;

        const date = new Date(paymentIntent.created * 1000);
        const identityID = paymentIntent.metadata.id;
        const plan = paymentIntent.metadata.type;

        if (customerID) {
          const userQuery = (await sql`SELECT id FROM users WHERE stripe_customer = ${customerID}`) as QueryUser[];
          const owner = userQuery[0].id;

          const alreadyExists = await sql`SELECT id FROM identities WHERE id = ${identityID}`;
          if (alreadyExists.length) return {received: true};

          await sql`INSERT INTO identities (id, owner, creation_date, plan, payment_intent) VALUES (${identityID}, ${owner}, ${date}, ${plan}, ${intentID})`;
        }
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;

      const isSubscription = invoice.parent?.type === 'subscription_details';
      const subObj = isSubscription ? invoice.parent?.subscription_details?.subscription : null;
      const subscriptionID = typeof subObj === 'string' ? subObj : subObj?.id;

      if (subscriptionID) {
        if (invoice.billing_reason === 'subscription_create' && invoice.customer) {
          const customerID = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
          const date = new Date(invoice.created * 1000);

          const subscription = await stripe.subscriptions.retrieve(subscriptionID);
          const identityID = subscription.metadata!.id;
          const plan = subscription.metadata!.type;

          const userQuery = (await sql`SELECT id FROM users WHERE stripe_customer = ${customerID}`) as QueryUser[];
          const owner = userQuery[0].id;

          const alreadyExists = await sql`SELECT id FROM identities WHERE id = ${identityID}`;
          if (alreadyExists.length) return {received: true};

          await sql`INSERT INTO identities (id, owner, creation_date, plan, subscription_id) VALUES (${identityID}, ${owner}, ${date}, ${plan}, ${subscriptionID})`;
        } else {
          await sql`UPDATE identities SET status = 'active' WHERE subscription_id = ${subscriptionID}`;
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;

      const isSubscription = invoice.parent?.type === 'subscription_details';
      const subObj = isSubscription ? invoice.parent?.subscription_details?.subscription : null;
      const subscriptionID = typeof subObj === 'string' ? subObj : subObj?.id;

      if (subscriptionID) {
        await sql`UPDATE identities SET status = 'frozen' WHERE subscription_id = ${subscriptionID}`;
      }
    }

    if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
      const object = event.data.object as Stripe.Charge | Stripe.Dispute;
      let identityQuery = [] as QueryIdentity[];

      const intentObj = 'payment_intent' in object ? object.payment_intent : null;
      const intentID = typeof intentObj === 'string' ? intentObj : intentObj?.id;

      if (intentID) {
        identityQuery = await sql`SELECT id FROM identities WHERE payment_intent = ${intentID}`;

        if (identityQuery.length === 0) {
          const payments = await stripe.invoicePayments.list({
            payment: {type: 'payment_intent', payment_intent: intentID},
            limit: 1,
          });

          if (payments.data.length > 0) {
            const invoiceObj = payments.data[0].invoice;
            const invoiceID = typeof invoiceObj === 'string' ? invoiceObj : invoiceObj.id;
            const invoice = await stripe.invoices.retrieve(invoiceID);

            const isSubscription = invoice.parent?.type === 'subscription_details';
            const subObj = isSubscription ? invoice.parent?.subscription_details?.subscription : null;
            const subID = typeof subObj === 'string' ? subObj : subObj?.id;

            if (subID) {
              identityQuery = await sql`SELECT id FROM identities WHERE subscription_id = ${subID}`;
            }
          }
        }
      }

      if (identityQuery.length) {
        await req('/billing/cancel', 'DELETE', {id: identityQuery[0].id});
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const exist = await sql`SELECT id FROM identities WHERE subscription_id = ${subscription.id}`;
      if (exist.length) await req('/billing/cancel', 'DELETE', {id: exist[0].id});
    }

    return {received: true};
  })
  .post('/webhook-twilio', async ({set, body, request}) => {
    const website = request.headers.get('X-Forwarded-Proto') + '://' + request.headers.get('X-Forwarded-Host');
    const url = `${website}/webhook-twilio`;

    const signature = request.headers.get('X-Twilio-Signature') || '';
    const rawBody = body as {[key: string]: string};
    const auth = process.env.TWILIO_TOKEN!;

    if (!twilioClient.validateRequest(auth, signature, url, rawBody)) {
      return error(set, 400, 'Invalid signature');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const rawMessage = await twilio.messages.get(rawBody.MessageSid).fetch();
    const message = parseMessage(rawMessage);

    const ws = WSConnections.find((ws) => ws.phoneNumber === message.to);
    if (!ws) return;

    ws?.websocket.send(JSON.stringify({type: 'message', message}));
  });
