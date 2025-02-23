import {User} from '../types';
import {Elysia, error} from 'elysia';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';

export default new Elysia({prefix: '/identity'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(9);
    const auth = ['/'];

    if (auth.some((p) => relativePath === p) && !user) {
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

    const allIdentities = await Promise.all(allIdentitiesPromises);

    return allIdentities;
  });
