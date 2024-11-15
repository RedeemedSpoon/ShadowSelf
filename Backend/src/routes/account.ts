import {attempt, hashAndSaltPassword} from '../utils';
import type {BodyAccount} from '../types';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .post('/signup', async (Context) => {
    const body = Context.body as BodyAccount;

    if (!body.username) {
      return {message: 'Username is required', type: 'info'};
    }

    if (!body.password) {
      return {message: 'Password is required', type: 'info'};
    }

    const password = await hashAndSaltPassword(body.password);
    const result = await attempt(sql`INSERT INTO users (username, password) VALUES (${body.username}, ${password})`);

    if (result instanceof Error && result.message.match(/unique.*constraint/)) {
      return {message: 'This username is already taken', type: 'alert'};
    }

    if (result instanceof Error) {
      return {message: result.message, type: 'alert'};
    }

    const cookieValue = await Context.jwt.sign({username: body.username});
    return {cookie: cookieValue};
  });
