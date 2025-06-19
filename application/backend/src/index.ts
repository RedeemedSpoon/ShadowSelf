import {checkContact} from '@utils/checks';
import {contact} from '@utils/email-smtp';
import {ContactDetail} from '@types';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

import creationProcess from './routes/creation-process';
import webhooks from './routes/webhooks';
import settings from './routes/settings';
import account from './routes/account';
import billing from './routes/billing';
import api from './routes/api';

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
  .use(creationProcess)
  .use(webhooks)
  .use(settings)
  .use(account)
  .use(billing)
  .use(api)
  .listen(3000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
