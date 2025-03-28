import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {Elysia, error} from 'elysia';
import {sql} from '@utils/connection';
import {attempt} from '@utils/utils';
import {APIRequest} from '@types';

export default new Elysia({prefix: '/account'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
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
  })
  .post('/add-account/:id', async ({identity, body}) => {
    const {err, username, password, website, totp, algorithm} = await checkAPI(body);
    if (err) return error(400, err);

    const res = await attempt(
      sql`INSERT INTO accounts (owner, username, password) VALUES (${identity!.id}, ${username!}, ${password!}) RETURNING id`,
    );

    if (website) await attempt(sql`UPDATE accounts SET website = ${website!} WHERE id = ${res[0].id}`);
    if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!}, algorithm = ${algorithm!} WHERE id = ${res[0].id!}`);

    return {username, password, website, totp, algorithm, id: res[0].id};
  })
  .post('/edit-account/:id', async ({identity, body}) => {
    const {err, username, password, website, totp, algorithm, id} = await checkAPI(body);
    if (err) return error(400, err);

    const uid = identity!.id;
    await attempt(sql`UPDATE accounts SET username = ${username!}, password = ${password!} WHERE id= ${id} AND owner = ${uid}`);

    if (website) await attempt(sql`UPDATE accounts SET website = ${website!} WHERE id = ${id!}  AND owner = ${uid}`);
    if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!}, algorithm = ${algorithm!} WHERE id = ${id!} AND owner = ${uid}`);

    return {username, password, website, totp, algorithm, id};
  })
  .post('/remove-account/:id', async ({identity, body}) => {
    const {err, id} = await checkAPI(body);
    if (err) return error(400, err);

    await attempt(sql`DELETE FROM accounts WHERE id = ${id!} AND owner = ${identity!.id}`);
    return {id};
  })
  .post('/update-encryption/:id', async ({identity, body}) => {
    const accounts = (body as APIRequest)?.accounts || null;
    if (!accounts || typeof accounts !== 'object') return error(400, 'Accounts Array are required');

    for (const account of accounts) {
      const {err, id, password, totp} = await checkAPI(account);
      if (err) return error(400, err);

      await attempt(sql`UPDATE accounts SET password = ${password!} WHERE id = ${id!} AND owner = ${identity!.id}`);
      if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!} WHERE id = ${id!} AND owner = ${identity!.id}`);
    }

    return {accounts};
  });
