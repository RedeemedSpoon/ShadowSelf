import type {ContactDetail} from './types';
import {msg, sendEmail} from './utils';
import {checkContact} from './checks';
import {Elysia} from 'elysia';

import api from './routes/api';
import account from './routes/account';
import billing from './routes/billing';
import identity from './routes/identity';
import extension from './routes/extension';

const app = new Elysia()
  .post('/contact', async ({body}: {body: ContactDetail}) => {
    const {err} = checkContact(body);
    if (err) return msg(err, 'alert');
    return await sendEmail(body);
  })
  .use(api)
  .use(account)
  .use(billing)
  .use(identity)
  .use(extension)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
