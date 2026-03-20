import {initBackgroundWorkers} from '@background-workers';
import {checkContact} from '@utils/checks';
import {contact} from '@utils/email-smtp';
import {ContactDetail} from '@types';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

import webhooks from './routes/webhooks';
import settings from './routes/user-settings';
import creationProcess from './routes/creation-process';
import api from './routes/public-api/main-api';
import account from './routes/user-account';
import billing from './routes/billing';

const app = new Elysia()
  .onError(async ({error}) => {
    if (error instanceof Error) return {message: error.message};
    else if (error instanceof Response) return {message: await error.text()};
    else return {message: error};
  })
  .get('/', () => 'Hello from ShadowSelf!')
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
