import {sql} from '@core/services';
import {chainProvider} from '@core/chain-provider';
import {withIdentityLock} from '@core/identity-service';
import {ApiError} from '@core/security';
import {UUID_PATTERN} from '@core/constants';
import {xpubToAddress} from '@utils/cryptography';
import {withReservedTransaction} from '@utils/utils';
import type {WalletIssuedBounds, WalletAddressAllocation, UtxoWalletData} from '@type';
import type {ReservedSql} from 'postgres';

export async function issuedWalletAddresses(id: string, database: typeof sql | ReservedSql = sql) {
  const rows = await database`SELECT coin, branch, MAX(address_index) AS index FROM wallet_addresses
    WHERE identity_id = ${id} GROUP BY coin, branch`;
  const bounds: Record<'btc' | 'ltc', WalletIssuedBounds> = {
    btc: {receive: -1, change: -1},
    ltc: {receive: -1, change: -1},
  };

  for (const row of rows) {
    bounds[row.coin as 'btc' | 'ltc'][row.branch === 0 ? 'receive' : 'change'] = row.index;
  }

  return bounds;
}

export async function rememberRecoveredAddresses(
  id: string,
  owner: number,
  coin: 'btc' | 'ltc',
  wallet: UtxoWalletData,
) {
  return withIdentityLock(id, async (connection) => {
    await withReservedTransaction(connection, async (database) => {
      const identities = await database`SELECT id FROM identities WHERE id = ${id} AND owner = ${owner} FOR UPDATE`;

      if (!identities.length) {
        throw new ApiError(404, 'identity_not_found', 'Identity not found');
      }

      for (const [branch, index] of [
        [0, wallet.discovered.receive],
        [1, wallet.discovered.change],
      ] as const) {
        if (index >= 0) {
          await database`INSERT INTO wallet_addresses (identity_id, coin, branch, address_index, request_id)
            VALUES (${id}, ${coin}, ${branch}, ${index}, gen_random_uuid()) ON CONFLICT DO NOTHING`;
        }
      }
    });
  });
}

export async function reserveWalletAddress(
  id: string,
  owner: number,
  input: unknown,
  signal?: AbortSignal,
): Promise<WalletAddressAllocation> {
  const {coin, branch, requestID} = (input ?? {}) as {coin?: string; branch?: number; requestID?: string};

  if (
    (coin !== 'btc' && coin !== 'ltc') ||
    (branch !== 0 && branch !== 1) ||
    typeof requestID !== 'string' ||
    !UUID_PATTERN.test(requestID)
  ) {
    throw new ApiError(400, 'invalid_address_request', 'Choose an asset, address branch and unique request ID');
  }

  return withIdentityLock(id, async (connection) => {
    const identities = await connection`SELECT wallet_keys FROM identities WHERE id = ${id} AND owner = ${owner}`;

    if (!identities.length) {
      throw new ApiError(404, 'identity_not_found', 'Identity not found');
    }

    const xpub = identities[0].wallet_keys[coin];
    const existing = await connection`SELECT branch, address_index FROM wallet_addresses
      WHERE identity_id = ${id} AND coin = ${coin} AND request_id = ${requestID!}`;

    if (existing.length) {
      if (existing[0].branch !== branch) {
        throw new ApiError(409, 'address_request_mismatch', 'This request ID belongs to a different address branch');
      }

      const index = existing[0].address_index;

      return {coin, branch, index, address: xpubToAddress(coin, xpub, index, branch)};
    }

    const issued = await issuedWalletAddresses(id, connection);
    const wallet = await chainProvider.utxo(coin, xpub, {issued: issued[coin], signal});
    const index = branch === 0 ? wallet.nextReceiveIndex : wallet.nextChangeIndex;

    if (wallet.status !== 'Synced' || index === null || index >= 2 ** 31) {
      throw new ApiError(503, 'discovery_incomplete', 'Complete wallet discovery before creating another address');
    }

    return withReservedTransaction(connection, async (database) => {
      const owners = await database`SELECT id FROM identities WHERE id = ${id} AND owner = ${owner} FOR UPDATE`;

      if (!owners.length) {
        throw new ApiError(404, 'identity_not_found', 'Identity not found');
      }

      await database`INSERT INTO wallet_addresses (identity_id, coin, branch, address_index, request_id)
        VALUES (${id}, ${coin}, ${branch}, ${index}, ${requestID!})`;

      return {coin, branch, index, address: xpubToAddress(coin, xpub, index, branch)};
    });
  });
}
