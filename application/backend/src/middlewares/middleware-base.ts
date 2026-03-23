import {jwtSecret} from '@core/config';
import {jwt} from '@elysiajs/jwt';
import type {User} from '@type';
import {Elysia} from 'elysia';

export default (app: Elysia) =>
  app.use(jwt({name: 'jwt', secret: jwtSecret, exp: '90d'})).derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  });
