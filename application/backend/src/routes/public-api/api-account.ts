import middlewareApi from '@middlewares/middleware-api';
import {checkAPI, validCiphertext} from '@utils/checks';
import type {VaultMutation} from '@type';
import {error} from '@utils/utils';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(middlewareApi)
  .get('/:id', async ({identity}) => {
    const accounts = await sql`SELECT id, username, password, website, totp, algorithm FROM accounts WHERE owner = ${identity!.id}`;

    return {accounts, vaultRevision: identity!.vault_revision};
  })
  .post('/add-account/:id', async ({set, identity, body}) => {
    const {err, username, password, website, totp, algorithm} = await checkAPI(body, ['username', 'password', '?website', '?totp', '?algorithm']);
    if (err) return error(set, 400, err);

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const rows = await transaction`INSERT INTO accounts (owner, username, password, website, totp, algorithm)
        VALUES (${identity!.id}, ${username}, ${password}, ${website || null}, ${totp || null}, ${totp ? algorithm || 'SHA1' : null})
        RETURNING id, username, password, website, totp, algorithm`;

      return rows[0];
    });
  })
  .put('/edit-account/:id', async ({set, identity, body}) => {
    const {err, id, username, password, website, totp, algorithm} = await checkAPI(body, ['id', 'username', 'password', '?website', '?totp', '?algorithm']);
    if (err) return error(set, 400, err);

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const existing = await transaction`SELECT * FROM accounts WHERE id = ${id} AND owner = ${identity!.id}`;
      if (!existing.length) return error(set, 404, 'Account not found');
      const nextTotp = totp === undefined ? existing[0].totp : totp || null;
      const nextWebsite = website === undefined ? existing[0].website : website || null;
      const nextAlgorithm = nextTotp ? algorithm || existing[0].algorithm || 'SHA1' : null;
      const rows = await transaction`UPDATE accounts SET username = ${username}, password = ${password}, website = ${nextWebsite},
        totp = ${nextTotp}, algorithm = ${nextAlgorithm} WHERE id = ${id} AND owner = ${identity!.id}
        RETURNING id, username, password, website, totp, algorithm`;

      return rows[0];
    });
  })
  .put('/update-encryption/:id', async ({set, identity, body}) => {
    const input = body as VaultMutation;
    if (!input || !Array.isArray(input.accounts) || !validCiphertext(input.blob) || !input.keys) return error(set, 400, 'Invalid encryption payload');
    if (![input.keys.address, input.keys.viewKey, input.keys.spendKey].every(validCiphertext)) return error(set, 400, 'Invalid encrypted wallet keys');
    if (input.accounts.some((account) => !account || !validCiphertext(account.password) || (account.totp !== null && !validCiphertext(account.totp)))) {
      return error(set, 400, 'Invalid encrypted account');
    }

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const accounts = await transaction`SELECT id FROM accounts WHERE owner = ${identity!.id}`;
      const ids = new Set(input.accounts.map((account) => account.id));
      if (ids.size !== input.accounts.length || accounts.length !== ids.size || accounts.some((account) => !ids.has(account.id))) {
        return error(set, 409, 'The vault changed. Reload before changing its password');
      }

      for (const account of input.accounts) {
        await transaction`UPDATE accounts SET password = ${account.password}, totp = ${account.totp} WHERE id = ${account.id} AND owner = ${identity!.id}`;
      }
      await transaction`UPDATE identities SET wallet_blob = ${input.blob}, wallet_keys = jsonb_set(wallet_keys, '{xmr}', ${transaction.json({...input.keys})}) WHERE id = ${identity!.id}`;

      return {accounts: input.accounts, blob: input.blob, keys: input.keys};
    });
  })
  .delete('/delete-account/:id', async ({set, identity, body}) => {
    const {err, id} = await checkAPI(body, ['id']);
    if (err) return error(set, 400, err);

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const rows = await transaction`DELETE FROM accounts WHERE id = ${id} AND owner = ${identity!.id} RETURNING id`;
      if (!rows.length) return error(set, 404, 'Account not found');

      return {id};
    });
  });

async function mutateVault(id: string, body: unknown, set: Record<string, any>, mutation: VaultMutation['apply']) {
  const revision = (body as VaultMutation)?.vaultRevision;
  if (!Number.isSafeInteger(revision) || revision < 1) return error(set, 400, 'Vault revision is required');

  return sql.begin(async (transaction) => {
    const identities = await transaction`SELECT vault_revision FROM identities WHERE id = ${id} AND status = 'active' FOR UPDATE`;
    if (!identities.length) return error(set, 404, 'Identity not found');
    if (identities[0].vault_revision !== revision) return error(set, 409, 'The vault changed. Reload before editing');

    const result = await mutation(transaction);
    if (typeof result === 'string') return result;
    await transaction`UPDATE identities SET vault_revision = vault_revision + 1 WHERE id = ${id}`;

    return {...result, vaultRevision: revision + 1};
  });
}
