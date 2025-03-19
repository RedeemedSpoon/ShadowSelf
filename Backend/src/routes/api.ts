import {attempt, parseMessage, resizeImage} from '../utils';
import {fetchRecentEmails} from '../email-imap';
import {sql, twilioClient} from '../connection';
import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {User} from '../types';

export default new Elysia({prefix: '/api'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(4);
    const auth = ['', '/identity', '/email', '/phone', '/card', '/account'];

    const isAuthorizedPath = auth.some((p) => {
      return relativePath === p || relativePath === `${p}/`;
    });

    if (isAuthorizedPath && !user) {
      return error(401, 'You are not authorized to access this route');
    }
  })
  .get('/', async ({user}) => {
    const result = await attempt(sql` SELECT * FROM users u JOIN identities i ON u.id = i.owner WHERE u.email = ${user!.email}`);
    if (!result.length) return error(400, 'User/Identity not found');

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
  .get('/identity/:id', async ({user, params}) => {
    const identityID = params.id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(400, 'Identity not found');

    const {picture, name, bio, age, sex, ethnicity} = identity[0];
    const {id, creation_date, proxy_server, user_agent, location, email, phone, card} = identity[0];

    return {id, creation_date, proxy_server, user_agent, picture, name, bio, age, sex, ethnicity, location, email, phone, card};
  })
  .get('/email/:id', async ({user, params}) => {
    const identityID = params.id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(400, 'Identity not found');

    return {emails: await fetchRecentEmails(identity[0].email, identity[0].email_password)};
  })
  .get('/phone/:id', async ({user, params}) => {
    const identityID = params.id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(400, 'Identity not found');

    const receivedMessages = await parseMessage(await twilioClient.messages.list({to: identity[0].phone}));
    const sentMessages = await parseMessage(await twilioClient.messages.list({from: identity[0].phone}));

    return {receivedMessages, sentMessages};
  })
  .get('/card/:id', async ({user, params}) => ({}))
  .get('/account/:id', async ({user, params}) => {
    const identityID = params.id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(400, 'Identity not found');

    const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${identity[0].id}`);
    const formattedAccounts = accounts.map((account) => ({
      id: account.id,
      username: account.username,
      password: account.password,
      website: account.website,
      totp: account.totp,
      algorithm: account.algorithm,
    }));

    return {accounts: formattedAccounts};
  });
