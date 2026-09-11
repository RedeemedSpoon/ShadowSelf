import {getBearerToken, verifySessionToken, trustedCookieRequest} from '@middlewares/session-auth';
import {jwtSecret} from '@core/config';
import {jwt} from '@elysiajs/jwt';
import {Elysia} from 'elysia';

export default (app: Elysia) =>
  app.use(jwt({name: 'jwt', secret: jwtSecret, exp: '90d'})).derive(async ({headers, cookie, jwt, request, set}) => {
    if (cookie.token?.value && !trustedCookieRequest(request)) {
      set.status = 403;
      throw new Response('Untrusted request origin', {status: 403});
    }

    const token = getBearerToken(headers.authorization) ?? (cookie.token?.value as string);
    const authorize = async () => !!(await verifySessionToken(token, jwt));
    const user = await verifySessionToken(token, jwt);

    return {user, authorize};
  });
