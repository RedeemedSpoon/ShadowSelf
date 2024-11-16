import {attemptQuery, hashAndSaltPassword, msg} from '../utils';
import {check, checkError} from '../checks';
import {BodyField} from '../types';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    return {user: await jwt.verify(token)};
  })
  .get('/', async ({user}) => user)
  .post('/signup', async ({jwt, body, user}) => {
    if (user) return msg('You are already logged in', 'info');

    const {password, username, err} = check(body as BodyField, ['password', 'username']);
    if (err) return msg(err, 'alert');

    const newPassword = await hashAndSaltPassword(password);
    const result = await attemptQuery(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);
    if (result instanceof Error) return checkError(result, 'Username');

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  });
