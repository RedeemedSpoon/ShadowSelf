import {getBearerToken, verifySessionToken, trustedCookieRequest} from '@middlewares/session-auth';
import {ApiError} from '@core/security';
import {Elysia} from 'elysia';

const middlewareBase = (app: Elysia) =>
  app
    .derive(async ({headers, cookie, request}) => {
      if (cookie.token?.value && !trustedCookieRequest(request)) {
        throw new ApiError(403, 'untrusted_origin', 'Untrusted request origin');
      }

      const token = getBearerToken(headers.authorization) ?? (cookie.token?.value as string);
      const authorize = async () => !!(await verifySessionToken(token));
      const user = await verifySessionToken(token);

      return {user, authorize};
    })
    .macro({
      signedOut: {
        beforeHandle({user}) {
          if (user) {
            throw new ApiError(401, 'unauthenticated', 'You are already logged in');
          }
        },
      },
      authenticated: {
        resolve({user}) {
          if (!user) {
            throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
          }

          return {user};
        },
      },
    });

export default middlewareBase;
