import {stripe, sql, twilio} from '@utils/connection';
import {error, proxyRequest} from '@utils/utils';
import type {QueryIdentity} from '@types';
import middleware from '@middleware';
import {check} from '@utils/checks';
import {Elysia} from 'elysia';
import {$} from 'bun';

import billingFiat from './billing-fiat';
import billingCrypto from './billing-crypto';

export default new Elysia({prefix: '/billing'})
  .use(middleware)
  .use(billingFiat)
  .use(billingCrypto)
  .delete('/cancel', async ({set, body}) => {
    const {err, id} = check(body, ['id']);
    if (err) return error(set, 400, err);

    const identity = (await sql`SELECT * FROM identities WHERE id = ${id}`)?.[0] as QueryIdentity;
    if (!identity) return error(set, 404, 'Identity not found');

    const intent = identity.payment_intent;
    const subscription = identity.subscription_id;

    const date = identity.creation_date;
    const difference = new Date().getTime() - new Date(date).getTime();
    const differenceInDays = difference / (1000 * 3600 * 24);

    try {
      if (differenceInDays <= 14) {
        if (intent) {
          await stripe.refunds.create({payment_intent: intent});
        } else if (subscription) {
          const invoices = await stripe.invoices.list({subscription: subscription, limit: 1});
          const invoiceObj = invoices.data[0];

          if (invoiceObj) {
            const payments = await stripe.invoicePayments.list({invoice: invoiceObj.id, limit: 1});
            const piObj = payments.data[0]?.payment?.payment_intent;
            const finalPiID = typeof piObj === 'string' ? piObj : piObj?.id;

            if (finalPiID) {
              await stripe.refunds.create({payment_intent: finalPiID});
            }
          }
        }
      }

      if (subscription) {
        const result = await stripe.subscriptions.retrieve(subscription);
        if (result.status !== 'canceled') await stripe.subscriptions.cancel(subscription);
      }
    } catch (_) {}

    const username = identity.email.split('@')[0];
    await $`userdel -r ${username}`.nothrow().quiet();
    await twilio.incomingPhoneNumbers(identity.phone).remove();

    const country = identity.location.split(', ')[0].toLowerCase();
    await proxyRequest(country, 'DELETE', {username: identity.id});

    await sql`DELETE FROM accounts WHERE owner = ${identity.id}`;
    await sql`DELETE FROM identities WHERE id = ${identity.id}`;

    return {success: true};
  });
