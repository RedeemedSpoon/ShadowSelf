import {initBackgroundWorkers} from '@core/background-workers';
import {checkContact} from '@utils/checks';
import {contact} from '@utils/email-smtp';
import type {ContactDetail} from '@type';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';
import {billingReadiness, cryptoPrices} from '@core/states';
import {POLL_INVOICES_INTERVAL, POLL_PRICES_INTERVAL} from '@core/constants';

import creationProcess from './routes/creation-process';
import settings from './routes/user-settings';
import api from './routes/public-api/index';
import account from './routes/user-account';
import webhooks from './routes/webhooks';
import billing from './routes/billing';

const app = new Elysia({serve: {maxRequestBodySize: 20 * 1024 * 1024}})
  .onError(async ({code, error, set}) => {
    if (error instanceof Response) {
      set.status = error.status;
      return await error.text();
    }
    if (code === 'VALIDATION') {
      set.status = 400;
      return 'Invalid request';
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return 'Route not found';
    }

    console.error('Request failed', code);
    set.status = 500;
    return 'Request failed. Please retry shortly';
  })
  .get('/', () => 'Hello from ShadowSelf!')
  .get('/health/live', () => ({status: 'ok'}))
  .get('/health/billing', ({set}) => {
    const ready =
      billingReadiness.available &&
      Date.now() - billingReadiness.lastSync < POLL_INVOICES_INTERVAL * 3 &&
      Date.now() - billingReadiness.priceSync < POLL_PRICES_INTERVAL * 3 &&
      !!cryptoPrices.xmr?.usdPrice;
    set.status = ready ? 200 : 503;

    return {status: ready ? 'ready' : 'unavailable'};
  })
  .post('/contact', async ({body, set}) => {
    const {err} = checkContact(body);
    if (err) return error(set, 400, err);

    const result = await contact(body as ContactDetail);
    if (result.err) return error(set, 500, result.err);
    return result.message;
  })
  .use(api)
  .use(webhooks)
  .use(creationProcess)
  .use(settings)
  .use(account)
  .use(billing)
  .listen(3000);

initBackgroundWorkers();
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
