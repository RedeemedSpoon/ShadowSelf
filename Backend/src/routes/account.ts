import type {BodyAccount} from '../types';
import {sql} from '../connection';
import {Elysia} from 'elysia';
import {attempt} from '../utils';

export default new Elysia({prefix: '/account'}).post('/signup', async (Context) => {
  const {username, password} = Context.body as BodyAccount;

  const result = await attempt(sql`INSERT INTO users (username, password) VALUES (${username}, ${password})`);

  if (result instanceof Error) {
    return {message: result.message, type: 'alert'};
  }

  return {cookie: 'test'};
});
