import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
import {attempt} from '../utils';
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
      const {id, picture, name, location, email, phone, card} = identity;

      const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${id}`);
      const formattedLocation = location.split(',')[1].trim();
      const country = location.split(',')[0];

      return {id, picture, name, email, phone, card, country, location: formattedLocation, accounts: accounts?.length};
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
  .get('/email/:id', async ({user, params}) => ({}))
  .get('/phone/:id', async ({user, params}) => ({}))
  .get('/card/:id', async ({user, params}) => ({}))
  .get('/account/:id', async ({user, params}) => ({}));
