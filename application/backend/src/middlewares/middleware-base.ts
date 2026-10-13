import {getBearerToken, verifySessionToken, trustedCookieRequest} from '@middlewares/session-auth';
import {ApiError} from '@core/security';
import {Elysia} from 'elysia';

export default (app: Elysia) =>
  app.derive(async ({headers, cookie, request}) => {
    if (cookie.token?.value && !trustedCookieRequest(request)) {
      throw new ApiError(403, 'untrusted_origin', 'Untrusted request origin');
    }

    const token = getBearerToken(headers.authorization) ?? (cookie.token?.value as string);
    const authorize = async () => !!(await verifySessionToken(token));
    const user = await verifySessionToken(token);

    return {user, authorize};
  });
