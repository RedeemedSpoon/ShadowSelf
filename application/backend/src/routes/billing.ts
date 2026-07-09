import middlewareBase from '@middlewares/middleware-base';
import type {QueryUser} from '@type';
import {cancelIdentityBilling} from '@core/billing';
import {sql} from '@core/services';
import {error} from '@utils/utils';
import {check} from '@utils/checks';
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

    const customer = (await sql`SELECT id FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const owner = customer[0]?.id;
    if (!owner) return error(set, 404, 'Identity not found');

    const canceled = await cancelIdentityBilling(id, owner);
    if (!canceled) return error(set, 404, 'Identity not found');

    return {success: true};
  });
