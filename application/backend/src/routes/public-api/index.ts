import {SOCKET_MAILBOX_CONNECTION_LIMIT} from '@core/constants';
import middlewareApi from '@middlewares/middleware-api';
import type {QueryIdentity} from '@type';
import {listenForEmail} from '@utils/email-imap';
import {wsConnections, guardedAuthTimer, socketCapacityAvailable} from '@core/states';
import {sql} from '@core/services';
import information from './api-information';
import account from './api-account';
import crypto from './api-crypto';
import phone from './api-phone';
import email from './api-email';
import {Elysia} from 'elysia';

const network = {status: 'unavailable', reason: 'A network provider has not been configured'};

async function listIdentities(owner: number) {
  const rows =
    (await sql`SELECT i.id, i.status, i.name, i.email, i.phone, i.location, i.picture, i.crypto_invoice, i.plan, (SELECT COUNT(*)::integer FROM accounts a WHERE a.owner = i.id) AS accounts
    FROM identities i WHERE owner = ${owner} ORDER BY creation_date DESC`) as (QueryIdentity & {accounts: number})[];

  return rows.map((identity) => ({
    id: identity.id,
    status: identity.status,
    name: identity.name,
    email: identity.email,
    phone: identity.phone,
    country: null,
    location: identity.location,
    picture: identity.picture,
    accounts: identity.accounts,
    paymentMethod: identity.crypto_invoice ? 'crypto' : 'fiat',
    plan: identity.plan,
  }));
}

export default new Elysia()
  .use(information)
  .use(account)
  .use(crypto)
  .use(phone)
  .use(email)
  .use(middlewareApi)
  .get('/api/auth/test', () => ({authenticated: true}))
  .get('/api/identities', async ({user}) => ({identities: await listIdentities(user!.accountID)}))
  .get('/api/extension', async ({user}) => {
    const rows = await sql`SELECT username FROM users WHERE id = ${user!.accountID}`;

    return {
      username: rows[0].username,
      identities: (await listIdentities(user!.accountID)).map((identity) => ({
        ...identity,
        name: identity.name || 'Identity setup',
      })),
      network,
    };
  })
  .ws('/api/identities/:id/events', {
    async open(ws) {
      const identity = ws.data.identity;
      const authorize = ws.data.authorize;

      try {
        if (!(await authorize())) {
          return ws.close(1008, 'Session expired');
        }
      } catch {
        return ws.close(1011, 'Authorization unavailable');
      }

      if (ws.raw.readyState !== 1) {
        return;
      }

      if (
        !socketCapacityAvailable(ws.data.user!.accountID) ||
        [...wsConnections.values()].filter((connection) => connection.emailAddress === identity!.email).length >=
          SOCKET_MAILBOX_CONNECTION_LIMIT
      ) {
        return ws.close(1013, 'Connection limit reached');
      }

      const authTimer = guardedAuthTimer(authorize, (code, reason) => ws.close(code, reason));
      wsConnections.set(ws.id, {
        stopEmail: () => {},
        websocket: ws,
        authorize,
        authTimer,
        emailAddress: identity!.email!,
      });

      const connection = wsConnections.get(ws.id);

      if (connection) {
        connection.stopEmail = listenForEmail(identity!.email!, identity!.mailbox_password_encrypted!, ws.id);
      }
    },
    close(ws) {
      const connection = wsConnections.get(ws.id);

      if (!connection) {
        return;
      }

      clearInterval(connection.authTimer);
      connection.stopEmail();
      wsConnections.delete(ws.id);
    },
    async message(ws, message) {
      try {
        if (!(await ws.data.authorize())) {
          return ws.close(1008, 'Session expired');
        }
      } catch {
        return ws.close(1011, 'Authorization unavailable');
      }

      if (message === 'ping') {
        ws.send('pong');
      }
    },
  });
