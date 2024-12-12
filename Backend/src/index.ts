import type {ContactDetail} from './types';
import {checkContact} from './checks';
import {Elysia, error} from 'elysia';
import {sendEmail} from './utils';

import account from './routes/account';

const app = new Elysia()
  .get('/', () => 'Hello from ShadowSelf.')
  .post('/contact', async ({body}) => {
    const {err} = checkContact(body);
    if (err) return error(400, err);

    const result = await sendEmail(body as ContactDetail);
    if (result.err) return error(500, result.err);
    return result.message;
  })
  .use(account)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
