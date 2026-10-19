import {checkContact} from '@utils/checks';
import {contact} from '@utils/email-smtp';
import type {ContactDetail} from '@type';
import {error, reportFailure} from '@utils/utils';
import {ApiError} from '@core/security';
import {Elysia} from 'elysia';
import {billingReadiness, cryptoPrices} from '@core/states';
import {POLL_INVOICES_INTERVAL, POLL_PRICES_INTERVAL} from '@core/constants';
import creation from './routes/creation-process';
import settings from './routes/user-settings';
import api from './routes/public-api/index';
import {createAccountRoutes} from './routes/user-account';
import type {sendVerificationCode} from '@utils/email-smtp';
import webhooks from './routes/webhooks';
import billing from './routes/billing';

export function createApp(providers: {sendVerificationCode?: typeof sendVerificationCode} = {}) {
  return new Elysia({serve: {maxRequestBodySize: 20 * 1024 * 1024}})
    .onError(({code, error: failure, set}) => {
      if (failure instanceof ApiError) {
        set.status = failure.status;

        return {error: {code: failure.code, message: failure.message}};
      }

      if (code === 'VALIDATION' || code === 'PARSE') {
        return error(set, 400, 'Invalid request');
      }

      if (code === 'NOT_FOUND') {
        return error(set, 404, 'Route not found');
      }

      if ((failure as {code?: string}).code === '23505') {
        return error(set, 409, 'This resource is already registered');
      }

      reportFailure('HTTP request', failure);

      return error(set, 500, 'The operation could not complete. Retry shortly');
    })
    .onRequest(({set}) => {
      set.headers['cache-control'] = 'no-store';
      set.headers['x-content-type-options'] = 'nosniff';
    })
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
    .post('/api/contact', async ({body, set}) => {
      const {err} = checkContact(body);

      if (err) {
        return error(set, 400, err);
      }

      const result = await contact(body as ContactDetail);

      if (result.err) {
        return error(set, 503, result.err);
      }

      return {message: result.message};
    })
    .use(api)
    .use(webhooks)
    .use(creation)
    .use(settings)
    .use(createAccountRoutes(providers.sendVerificationCode))
    .use(billing);
}
