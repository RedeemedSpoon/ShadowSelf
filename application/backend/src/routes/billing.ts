import middlewareBase from '@middlewares/middleware-base';
import {deleteIdentity} from '@core/identity/identity-service';
import {compareHash} from '@utils/cryptography';
import {claimSensitiveAttempt} from '@core/states';
import {error} from '@utils/utils';
import {sql} from '@core/services';
import {Elysia} from 'elysia';
import billingFiat from './billing-fiat';
import billingCrypto from './billing-crypto';
import billingReceipts from './billing-receipts';

export default new Elysia()
  .use(billingReceipts)
  .use(billingFiat)
  .use(billingCrypto)
  .use(middlewareBase)
  .guard({authenticated: true})
  .delete('/api/identities/:id', async ({set, params, body, user}) => {
    if (!/^[a-f0-9]{12}$/.test(params.id)) {
      return error(set, 404, 'Identity not found');
    }

    const password = (body as {currentPassword?: unknown})?.currentPassword;

    if (typeof password !== 'string' || password.length > 256) {
      return error(set, 403, 'Your current password is required');
    }

    if (!claimSensitiveAttempt(user.email)) {
      return error(set, 429, 'Too many password checks. Wait five minutes');
    }

    const accounts = await sql`SELECT id, password FROM users WHERE id = ${user.accountID}`;

    if (!accounts[0] || !(await compareHash(password, accounts[0].password))) {
      return error(set, 403, 'Incorrect current password');
    }

    const identities = await sql`SELECT id FROM identities WHERE id = ${params.id} AND owner = ${user.accountID}`;

    if (!identities.length) {
      return error(set, 404, 'Identity not found');
    }

    await deleteIdentity(params.id, user.accountID, (body as {refundAddress?: unknown})?.refundAddress);

    return {success: true};
  });
