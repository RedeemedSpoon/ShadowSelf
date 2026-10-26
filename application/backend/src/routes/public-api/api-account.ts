import middlewareApi from '@middlewares/middleware-api';
import {checkAPI, validCiphertext} from '@utils/checks';
import type {APIRequest, VaultMutation} from '@type';
import {error} from '@utils/utils';
import {sql} from '@core/services';
import {ApiError} from '@core/security';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/api/identities/:id/vault'})
  .use(middlewareApi)
  .get('/', async ({identity}) =>
    sql.begin(async (transaction) => {
      const rows =
        await transaction`SELECT vault_revision, wallet_blob FROM identities WHERE id = ${identity!.id} FOR SHARE`;

      if (!rows.length) {
        throw new ApiError(404, 'identity_not_found', 'Identity not found');
      }

      const accounts =
        await transaction`SELECT id, username, password, website, totp FROM accounts WHERE owner = ${identity!.id}`;

      return {accounts, vaultRevision: rows[0].vault_revision, walletBlob: rows[0].wallet_blob};
    }),
  )
  .post('/entries', async ({set, identity, body}) => {
    const {err, username, password, website, totp} = await checkVaultBody(body, [
      'username',
      'password',
      '?website',
      '?totp',
    ]);

    if (err) {
      return error(set, 400, err);
    }

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const rows = await transaction`INSERT INTO accounts (owner, username, password, website, totp)
        VALUES (${identity!.id}, ${username}, ${password}, ${website || null}, ${totp || null})
        RETURNING id, username, password, website, totp`;

      return rows[0];
    });
  })
  .patch('/entries', async ({set, identity, body}) => {
    const {err, id, username, password, website, totp} = await checkVaultBody(body, [
      'id',
      'username',
      'password',
      '?website',
      '?totp',
    ]);

    if (err) {
      return error(set, 400, err);
    }

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const existing = await transaction`SELECT * FROM accounts WHERE id = ${id} AND owner = ${identity!.id}`;

      if (!existing.length) {
        return error(set, 404, 'Account not found');
      }

      const nextTotp = totp === undefined ? existing[0].totp : totp || null;
      const nextWebsite = website === undefined ? existing[0].website : website || null;
      const rows =
        await transaction`UPDATE accounts SET username = ${username}, password = ${password}, website = ${nextWebsite},
        totp = ${nextTotp} WHERE id = ${id} AND owner = ${identity!.id}
        RETURNING id, username, password, website, totp`;

      return rows[0];
    });
  })
  .put('/encryption', async ({set, identity, body}) => {
    const {err} = await checkVaultBody(body, ['accounts', 'blob', 'keys']);

    if (err) {
      return error(set, 400, err);
    }

    const input = body as VaultMutation;

    if (!Array.isArray(input.accounts)) {
      return error(set, 400, 'Invalid encryption payload');
    }

    if (Object.keys(input.keys).some((field) => !['address', 'viewKey', 'spendKey'].includes(field))) {
      return error(set, 400, 'Invalid encrypted wallet keys');
    }

    if (
      input.accounts.some(
        (account) =>
          !account ||
          typeof account !== 'object' ||
          Array.isArray(account) ||
          Object.keys(account).some((field) => !['id', 'password', 'totp'].includes(field)) ||
          !Number.isSafeInteger(account.id) ||
          account.id < 1 ||
          !validCiphertext(account.password) ||
          (account.totp !== null && !validCiphertext(account.totp)),
      )
    ) {
      return error(set, 400, 'Invalid encrypted account');
    }

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const accounts = await transaction`SELECT id FROM accounts WHERE owner = ${identity!.id}`;

      const ids = new Set(input.accounts.map((account) => account.id));

      if (
        ids.size !== input.accounts.length ||
        accounts.length !== ids.size ||
        accounts.some((account) => !ids.has(account.id))
      ) {
        return error(set, 409, 'The vault changed. Reload before changing its password');
      }

      for (const account of input.accounts) {
        await transaction`UPDATE accounts SET password = ${account.password}, totp = ${account.totp} WHERE id = ${account.id} AND owner = ${identity!.id}`;
      }

      await transaction`UPDATE identities SET wallet_blob = ${input.blob}, wallet_keys = jsonb_set(wallet_keys, '{xmr}', ${transaction.json({...input.keys})}) WHERE id = ${identity!.id}`;

      return {accounts: input.accounts, blob: input.blob, keys: input.keys};
    });
  })
  .delete('/entries', async ({set, identity, body}) => {
    const {err, id} = await checkVaultBody(body, ['id']);

    if (err) {
      return error(set, 400, err);
    }

    return mutateVault(identity!.id, body, set, async (transaction) => {
      const rows = await transaction`DELETE FROM accounts WHERE id = ${id} AND owner = ${identity!.id} RETURNING id`;

      if (!rows.length) {
        return error(set, 404, 'Account not found');
      }

      return {id};
    });
  });

async function checkVaultBody(body: unknown, fields: string[]): Promise<APIRequest> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const allowed = new Set([...fields.map((field) => field.replace(/^\?/, '')), 'vaultRevision', 'walletBlob']);
    const unexpected = Object.keys(body).find((field) => !allowed.has(field));

    if (unexpected) {
      return {err: `Unexpected request field: ${unexpected}`} as APIRequest;
    }
  }

  return checkAPI(body, fields);
}

async function mutateVault(id: string, body: unknown, set: Record<string, any>, mutation: VaultMutation['apply']) {
  const revision = (body as VaultMutation)?.vaultRevision;
  const walletBlob = (body as VaultMutation)?.walletBlob;

  if (!Number.isSafeInteger(revision) || revision < 1 || !validCiphertext(walletBlob)) {
    return error(set, 400, 'Vault revision and encryption context are required');
  }

  return sql.begin(async (transaction) => {
    const identities =
      await transaction`SELECT vault_revision, wallet_blob FROM identities WHERE id = ${id} AND status = 'active' FOR UPDATE`;

    if (!identities.length) {
      return error(set, 404, 'Identity not found');
    }

    if (identities[0].vault_revision !== revision || identities[0].wallet_blob !== walletBlob) {
      return error(set, 409, 'The vault changed. Reload before editing');
    }

    const result = await mutation(transaction);

    if (result.error) {
      return result;
    }

    await transaction`UPDATE identities SET vault_revision = vault_revision + 1 WHERE id = ${id}`;

    return {...result, vaultRevision: revision + 1};
  });
}
