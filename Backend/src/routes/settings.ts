import {QueryResult, User} from '../types';
import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {sql} from '../connection';

export default new Elysia({prefix: '/settings'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(9);
    const mustLog = [
      '/',
      '/toggleOTP',
      '/toggleAPI',
      '/revoke',
      '/otp',
      '/recovery',
      '/api-key',
      '/username',
      '/password',
      '/billing',
      '/full',
    ];

    if (mustLog.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not logged in');
    }
  })
  .get('/', async ({user}) => {
    const result = (await attempt(sql`SELECT * FROM users WHERE username = ${user!.username}`)) as QueryResult[];
    if (!result.length) return error(400, 'Unknown username. Try relogging in');

    const {recovery, totp, api_access, api_key} = result[0];
    return {recovery: recovery || [], key: api_key, API: api_access, OTP: totp && true};
  })
  .get('/toggleAPI', '')
  .get('/revoke', '')
  .post('/otp', '')
  .post('/recovery', '')
  .post('/api-key', '')
  .put('/username', '')
  .put('/password', '')
  .put('/billing', '')
  .delete('/billing', '')
  .delete('/full', '');
