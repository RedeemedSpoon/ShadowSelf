import {sql, WSConnections} from '@utils/connection';
import {attempt, resizeImage} from '@utils/utils';
import {listenForEmail} from '@utils/email-imap';
import middleware from '@middleware-api';
import {Elysia, error} from 'elysia';

import information from './identity/information';
import account from './identity/account';
import phone from './identity/phone';
import email from './identity/email';
import card from './identity/card';

export default new Elysia()
  .use(middleware)
  .group('/api', (app) => app.use(card).use(phone).use(email).use(account).use(information))
  .get('/api/test', () => 'Authentication is working ;)')
  .get('/api', async ({user}) => {
    const result = await attempt(sql` SELECT * FROM users u JOIN identities i ON u.id = i.owner WHERE u.email = ${user!.email}`);
    if (!result.length) return error(400, 'No identities were found');

    const allIdentitiesPromises = result.map(async (identity) => {
      if (!identity.name) return {id: identity.id};
      const {id, picture, name, location, email, phone, card} = identity;

      const lowResPic = await resizeImage(picture);
      const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${id}`);
      const formattedLocation = location.slice(4).trim();
      const country = location.split(',')[0];

      return {id, picture: lowResPic, name, email, phone, card, country, location: formattedLocation, accounts: accounts?.length};
    });

    return await Promise.all(allIdentitiesPromises);
  })
  .get('/api/proxy', async ({user}) => {
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    if (!result.length) return error(400, 'User not found');

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
        https: 3128,
        socks5: 1080,
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
