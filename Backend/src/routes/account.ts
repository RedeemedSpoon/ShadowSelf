import {attemptQuery, hashAndSaltPassword, msg} from '../utils';
import {check, checkError} from '../checks';
import {BodyField} from '../types';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .post('/signup', async (Context) => {
    const {password, username, err} = check(Context.body as BodyField, ['password', 'username']);
    if (err) return msg(err, 'alert');

    const newPassword = await hashAndSaltPassword(password);
    const result = await attemptQuery(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);
    if (result instanceof Error) return checkError(result, 'Username');

    const cookieValue = await Context.jwt.sign({username: username});
    return {cookie: cookieValue};
  });
