import {jwtSecret} from '@core/config';
import {jwt} from '@elysiajs/jwt';
import {Elysia} from 'elysia';
import {User} from '@type';

export default (app: Elysia) =>
  app.use(jwt({name: 'jwt', secret: jwtSecret, exp: '90d'})).derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  });
