import {getBearerToken, verifySessionToken, verifyApiToken, trustedCookieRequest} from '@middlewares/session-auth';
import {ApiError} from '@core/security';
import {sql} from '@core/services';
import {isInitializedIdentity} from '@utils/checks';
import type {QueryIdentity, InitializedIdentity} from '@type';
import {Elysia} from 'elysia';

export default (app: Elysia) =>
  app.derive(async ({headers, params, path, cookie, request}) => {
    if (cookie.token?.value && !trustedCookieRequest(request)) {
      throw new ApiError(403, 'untrusted_origin', 'Untrusted request origin');
    }

    const token = getBearerToken(headers.authorization) ?? (cookie.token?.value as string);
    const authenticate = () => (token?.startsWith('ss_api_') ? verifyApiToken(token) : verifySessionToken(token));
    const user = await authenticate();

    if (!user) {
      throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
    }

    const authorize = async () => !!(await authenticate());

    if (!params?.id) {
      return {user, authorize};
    }

    if (!/^[a-f0-9]{12}$/.test(params.id)) {
      throw new ApiError(404, 'identity_not_found', 'Identity not found');
    }

    const rows =
      (await sql`SELECT * FROM identities WHERE id = ${params.id} AND owner = ${user.accountID}`) as QueryIdentity[];

    const identity = rows[0];

    if (!identity) {
      throw new ApiError(404, 'identity_not_found', 'Identity not found');
    }

    const metadataRequest = path === `/api/identities/${identity.id}` || path.includes('/creation');
    const identityPath = `/api/identities/${identity.id}`;
    const recoveryRequest =
      (request.method === 'GET' &&
        ['/vault', '/wallet', '/wallet/node'].some((suffix) => path === `${identityPath}${suffix}`)) ||
      (request.method === 'POST' &&
        [
          '/wallet/recovery',
          '/wallet/history',
          '/wallet/addresses',
          '/wallet/utxos/verify',
          '/wallet/prepare',
          '/wallet/transactions',
          '/wallet/transactions/reconcile',
        ].some((suffix) => path === `${identityPath}${suffix}`));

    if (!metadataRequest) {
      if (identity.status === 'frozen' && !recoveryRequest) {
        throw new ApiError(402, 'identity_frozen', 'Renew this identity to restore access');
      }

      if ((identity.status !== 'active' && identity.status !== 'frozen') || !isInitializedIdentity(identity)) {
        throw new ApiError(409, 'identity_incomplete', 'Complete identity setup to continue');
      }
    }

    const authorizeIdentity = async () => {
      if (!(await authorize())) {
        return false;
      }

      const current =
        await sql`SELECT id FROM identities WHERE id = ${identity.id} AND owner = ${user.accountID} AND status = 'active'`;

      return current.length > 0;
    };

    return {identity: identity as InitializedIdentity, user, authorize: authorizeIdentity};
  });
