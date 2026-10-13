import {SOCKET_AUTH_INTERVAL} from '@core/constants';
import middlewareApi from '@middlewares/middleware-api';
import type {QueryIdentity} from '@type';
import {listenForEmail} from '@utils/email-imap';
import {resizeTo256} from '@utils/utils';
import {wsConnections} from '@core/states';
import {sql} from '@core/services';
import information from './api-information';
import account from './api-account';
import crypto from './api-crypto';
import phone from './api-phone';
import email from './api-email';
import {Elysia} from 'elysia';

const network = {status: 'unavailable', reason: 'Network access is unavailable. Self-hosted proxy and VPN services are retired'};

async function listIdentities(owner: number) {
  const rows = (await sql`SELECT i.*, (SELECT COUNT(*)::integer FROM accounts a WHERE a.owner = i.id) AS accounts
    FROM identities i WHERE owner = ${owner} ORDER BY creation_date DESC`) as (QueryIdentity & {accounts: number})[];

  return await Promise.all(
    rows.map(async (identity) => ({
      id: identity.id,
      status: identity.status,
      name: identity.name,
      email: identity.email,
      phone: identity.phone,
      country: identity.location?.split(',')[0] || null,
      location: identity.location?.slice(4).trim() || null,
      picture: identity.picture ? await resizeTo256(identity.picture).catch(() => null) : null,
      accounts: identity.accounts,
      walletFunds: null,
      paymentMethod: identity.crypto_invoice ? 'crypto' : 'fiat',
      plan: identity.plan,
    })),
  );
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
      identities: (await listIdentities(user!.accountID)).map((identity) => ({...identity, name: identity.name || 'Identity setup'})),
      network,
    };
  })
  .ws('/api/identities/:id/events', {
    async open(ws) {
      const identity = ws.data.identity;
      const authorize = ws.data.authorize;

      if (!(await authorize())) {
        return ws.close(1008, 'Session expired');
      }

      const authTimer = setInterval(async () => {
        try {
          if (!(await authorize())) {
            ws.close(1008, 'Session expired');
          }
        } catch {
          ws.close(1011, 'Authorization unavailable');
        }
      }, SOCKET_AUTH_INTERVAL);
      wsConnections.set(ws.id, {stopEmail: () => {}, websocket: ws, authorize, authTimer, phoneNumber: identity!.phone!, emailAddress: identity!.email!});

      const connection = wsConnections.get(ws.id);

      if (connection) {
        connection.stopEmail = listenForEmail(identity!.email!, identity!.email_password!, ws.id);
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
      if (!(await ws.data.authorize())) {
        return ws.close(1008, 'Session expired');
      }

      if (message === 'ping') {
        ws.send('pong');
      }
    },
  });
