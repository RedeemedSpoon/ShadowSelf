import {attempt, error, resizeImage} from '@utils/utils';
import {sql, WSConnections} from '@utils/connection';
import {listenForEmail} from '@utils/email-imap';
import middleware from '@middleware-api';
import {Elysia} from 'elysia';

import information from './identity/information';
import account from './identity/account';
import crypto from './identity/crypto';
import phone from './identity/phone';
import email from './identity/email';

export default new Elysia()
  .use(middleware)
  .group('/api', (app) => app.use(crypto).use(phone).use(email).use(account).use(information))
  .get('/api/test', () => 'Authentication is working ;)')
  .get('/api', async ({set, user}) => {
    const result = await attempt(sql` SELECT * FROM users u JOIN identities i ON u.id = i.owner WHERE u.email = ${user!.email}`);
    if (!result.length) return error(set, 400, 'No identities were found');

    const allIdentitiesPromises = result.map(async (identity) => {
      if (!identity.name) return {id: identity.id};
      const {id, picture, name, location, email, phone, wallet_blob, wallet_keys} = identity;

      const lowResPic = await resizeImage(picture);
      const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${id}`);
      const formattedLocation = location.slice(4).trim();
      const country = location.split(',')[0];
      const restReturn = {picture: lowResPic, location: formattedLocation, accounts: accounts?.length};
      const cryptoData = {walletBlob: wallet_blob, walletKeys: wallet_keys};

      return {id, name, email, phone, country, ...cryptoData, ...restReturn};
    });

    return await Promise.all(allIdentitiesPromises);
  })
  .get('/api/proxy', async ({set, user}) => {
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    if (!result.length) return error(set, 400, 'User not found');

    const {username, id} = result[0];
    const allIdentities = await attempt(sql`SELECT * FROM identities WHERE owner = ${id}`);
    if (!allIdentities.length) return {username, identities: []};

    const identitiesPromises = allIdentities.map(async (identity) => {
      if (!identity.name) return {id: identity.id};

      const {id, picture, name, location, proxy_server, proxy_password} = identity;
      return {
        id,
        name,
        location,
        picture: await resizeImage(picture),
        domain: `${location.split(',')[0].toLowerCase()}.shadowself.io`,
        server: proxy_server,
        port: 3128,
        username: 'usr-' + id,
        password: 'pwd-' + proxy_password,
      };
    });

    return {username, identities: await Promise.all(identitiesPromises)};
  })
  .ws('/ws-api/:id', {
    async open(ws) {
      const identity = ws.data.identity;
      const connection = await listenForEmail(identity!.email, identity!.email_password);
      WSConnections.push({imapConnection: connection, websocket: ws, phoneNumber: identity!.phone, emailAddress: identity!.email});
    },

    async close(ws) {
      const connection = WSConnections.find((connection) => connection.websocket.id === ws.id);
      if (!connection) return;

      connection.imapConnection.end();
      WSConnections.splice(WSConnections.indexOf(connection), 1);
    },

    async message(ws, message) {
      if (message === 'ping') return ws.send('pong');
      else return ws.send('It is useless to send a message, it will be ignored.');
    },
  });
