import middleware from '@middleware-api';
import {sql} from '@utils/connection';
import {attempt} from '@utils/utils';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'}).use(middleware).get('/:id', async ({identity}) => {
  const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${identity!.id}`);
  const formattedAccounts = accounts.map((account) => ({
    id: account.id,
    username: account.username,
    password: account.password,
    website: account.website,
    totp: account.totp,
    algorithm: account.algorithm,
  }));

  return {accounts: formattedAccounts};
});
