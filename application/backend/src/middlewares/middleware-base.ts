import {jwtSecret} from '@core/config';
import {jwt} from '@elysiajs/jwt';
import {getBearerToken, verifySessionToken} from '@middlewares/session-auth';
import {Elysia} from 'elysia';

export default (app: Elysia) =>
  app.use(jwt({name: 'jwt', secret: jwtSecret, exp: '90d'})).derive(async ({headers, jwt}) => {
    const user = await verifySessionToken(getBearerToken(headers['authorization']), jwt);
    return {user};
  });
