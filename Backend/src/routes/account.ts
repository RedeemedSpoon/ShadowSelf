import {attemptQuery, comparePassword, hashAndSaltPassword, msg} from '../utils';
import {check, checkError} from '../checks';
import {BodyField, QueryResult} from '../types';
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
  })
  .post('/login', async ({jwt, body, user}) => {
    if (user) return msg('You are already logged in', 'info');

    const {password, username, err} = check(body as BodyField, ['password', 'username'], true);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (result.length === 0) return msg('Invalid Credentials. Please try again', 'alert');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await comparePassword(password, hashedPassword);
    if (!isPasswordCorrect) return msg('Invalid credentials. Please try again', 'alert');

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  });
