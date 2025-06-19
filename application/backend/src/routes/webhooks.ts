import {attempt, error, parseMessage, request as req} from '@utils/utils';
import {sql, stripe, twilio, WSConnections} from '@utils/connection';
import middleware from '@middleware';
import twilioClient from 'twilio';
import {Elysia} from 'elysia';

export default new Elysia()
  .use(middleware)
  .post('/webhook-stripe', async ({set, request}) => {
    const signature = request.headers.get('stripe-signature')!;
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const body = await request.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (err) {
      return error(set, 400, err instanceof Error ? err.message : (err as string));
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      if (paymentIntent.invoice === null && paymentIntent.metadata?.id && paymentIntent.metadata?.type) {
        const customerID = paymentIntent.customer! as string;
        const intentID = paymentIntent.id;

        const date = new Date(paymentIntent.created * 1000);
        const identityID = paymentIntent.metadata.id;
        const plan = paymentIntent.metadata.type;

        const userQuery = await attempt(sql`SELECT id FROM users WHERE stripe_customer = ${customerID}`);
        const owner = userQuery[0].id;

        const alreadyExists = await attempt(sql`SELECT id FROM identities WHERE id = ${identityID}`);
        if (alreadyExists.length) return;

        await attempt(
          sql`INSERT INTO identities (id, owner, creation_date, plan, payment_intent) VALUES (${identityID}, ${owner}, ${date}, ${plan}, ${intentID})`,
        );
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;

      if (invoice.billing_reason === 'subscription_create' && invoice.subscription && invoice.customer) {
        const customerID = invoice.customer! as string;
        const subscriptionID = invoice.subscription! as string;
        const date = new Date(invoice.created * 1000);

        const subscription = await stripe.subscriptions.retrieve(subscriptionID);
        const identityID = subscription.metadata!.id;
        const plan = subscription.metadata!.type;

        const userQuery = await attempt(sql`SELECT id FROM users WHERE stripe_customer = ${customerID}`);
        const owner = userQuery[0].id;

        const alreadyExists = await attempt(sql`SELECT id FROM identities WHERE id = ${identityID}`);
        if (alreadyExists.length) return;

        await attempt(
          sql`INSERT INTO identities (id, owner, creation_date, plan, subscription_id) VALUES (${identityID}, ${owner}, ${date}, ${plan}, ${subscriptionID})`,
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscriptionID = event.data.object.id;
      const exist = await attempt(sql`SELECT id FROM identities WHERE subscription_id = ${subscriptionID}`);
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
