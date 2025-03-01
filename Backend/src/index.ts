import type {ContactDetail} from './types';
import {checkContact} from './checks';
import {Elysia, error} from 'elysia';
import {contact} from './email';

import creationProcess from './routes/creation-process';
import extension from './routes/extension';
import settings from './routes/settings';
import account from './routes/account';
import billing from './routes/billing';
import api from './routes/api';

const app = new Elysia()
  .onError(({error}) => ({message: error.message}))
  .get('/', () => 'Hello from ShadowSelf.')
  .post('/contact', async ({body}) => {
    const {err} = checkContact(body);
    if (err) return error(400, err);

    const result = await contact(body as ContactDetail);
    if (result.err) return error(500, result.err);
    return result.message;
  })
  .use(creationProcess)
  .use(extension)
  .use(settings)
  .use(account)
  .use(billing)
  .use(api)
  .listen(3000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
