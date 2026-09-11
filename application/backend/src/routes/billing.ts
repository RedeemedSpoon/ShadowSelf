import middlewareBase from '@middlewares/middleware-base';
import {deleteIdentity} from '@core/identity-service';
import {compareHash} from '@utils/cryptography';
import {claimSensitiveAttempt} from '@core/states';
import {error} from '@utils/utils';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

import billingFiat from './billing-fiat';
import billingCrypto from './billing-crypto';

export default new Elysia({prefix: '/billing'})
  .use(middlewareBase)
  .use(billingFiat)
  .use(billingCrypto)
  .delete('/cancel', async ({set, body, user}) => {
    if (!user) return error(set, 401, 'You are not logged in');
    const {err, id} = check(body, ['id']);
    if (err) return error(set, 400, err);

    const password = (body as {currentPassword?: unknown}).currentPassword;
    if (typeof password !== 'string' || password.length > 256) return error(set, 403, 'Current password is required');
    if (!claimSensitiveAttempt(user.email)) return error(set, 429, 'Too many password checks. Please wait five minutes');

    const accounts = await sql`SELECT id, password FROM users WHERE email = ${user.email} AND ${user.id} = ANY(sessions)`;
    if (!accounts[0] || !(await compareHash(password, accounts[0].password))) return error(set, 403, 'Incorrect current password');
    const identities = await sql`SELECT id FROM identities WHERE id = ${id} AND owner = ${accounts[0].id}`;
    if (!identities.length) return error(set, 404, 'Identity not found');

    const done = await deleteIdentity(id, accounts[0].id);
    if (!done) return error(set, 202, 'Deletion is pending mailbox cleanup. Please retry shortly');

    return {success: true};
  });
