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
  .get('/api', async ({user}) => {
    const result = await attempt(sql` SELECT * FROM users u JOIN identities i ON u.id = i.owner WHERE u.email = ${user!.email}`);
    if (!result.length) return error(400, 'No identities were found');

    const allIdentitiesPromises = result.map(async (identity) => {
      if (!identity.name) return {};
      const {id, picture, name, location, email, phone, card} = identity;

      const lowResPic = await resizeImage(picture);
      const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${id}`);
      const formattedLocation = location.slice(4).trim();
      const country = location.split(',')[0];

      return {id, picture: lowResPic, name, email, phone, card, country, location: formattedLocation, accounts: accounts?.length};
    });

    return await Promise.all(allIdentitiesPromises);
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
