import {watchWallet, setWatchWallet, billingReadiness} from '@core/states';
import {XMR_NODE, RESTORE_HEIGHT} from '@core/constants';
import {moneroWallet, cryptoBillingEnabled} from '@core/config';
import {requireProvider} from '@core/security';
import {sql} from '@core/services';
import moneroTs from 'monero-ts';
import {createHash} from 'node:crypto';
import type {ReservedSql, Sql} from 'postgres';

let loadedRevision: string | null = null;
let savedDigest = '';

async function initMoneroWallet(connection: Sql | ReservedSql) {
  const cacheQuery = await connection`SELECT keys_data, cache_data, revision FROM wallet_cache WHERE id = 1`;

  if (watchWallet && cacheQuery[0] && String(cacheQuery[0].revision) === loadedRevision) {
    return;
  }

  if (watchWallet) {
    await watchWallet.close();
  }

  if (cacheQuery.length > 0) {
    setWatchWallet(
      await moneroTs.openWalletFull({
        password: moneroWallet.password,
        networkType: moneroTs.MoneroNetworkType.MAINNET,
        server: XMR_NODE,
        keysData: cacheQuery[0].keys_data,
        cacheData: cacheQuery[0].cache_data,
      }),
    );
    loadedRevision = String(cacheQuery[0].revision);
    savedDigest = createHash('sha256').update(cacheQuery[0].keys_data).update(cacheQuery[0].cache_data).digest('hex');
  } else {
    setWatchWallet(
      await moneroTs.createWalletFull({
        password: moneroWallet.password,
        networkType: moneroTs.MoneroNetworkType.MAINNET,
        primaryAddress: moneroWallet.address,
        privateViewKey: moneroWallet.viewKey,
        server: XMR_NODE,
        restoreHeight: RESTORE_HEIGHT,
      }),
    );

    await watchWallet.sync();
    await saveWalletState(connection);
  }
}

export async function saveWalletState(connection: Sql | ReservedSql, wallet = watchWallet) {
  if (!wallet) {
    return;
  }

  const data = await wallet.getData();

  const keysBuffer = Buffer.from(data[0].buffer, data[0].byteOffset, data[0].byteLength);
  const cacheBuffer = Buffer.from(data[1].buffer, data[1].byteOffset, data[1].byteLength);

  const digest = createHash('sha256').update(keysBuffer).update(cacheBuffer).digest('hex');

  if (digest === savedDigest) {
    return;
  }

  const saved = await connection`
    INSERT INTO wallet_cache (id, keys_data, cache_data)
    VALUES (1, ${keysBuffer}, ${cacheBuffer})
    ON CONFLICT (id) DO UPDATE SET
      keys_data = EXCLUDED.keys_data,
      cache_data = EXCLUDED.cache_data,
      revision = wallet_cache.revision + 1
    RETURNING revision
  `;

  loadedRevision = String(saved[0].revision);
  savedDigest = digest;
}

export function parseXmr(value: string) {
  if (!/^\d+(?:\.\d{1,12})?$/.test(value)) {
    throw new Error('Invalid Monero amount');
  }

  const [whole, fraction = ''] = value.split('.');

  return BigInt(whole) * 1_000_000_000_000n + BigInt(fraction.padEnd(12, '0'));
}

export function quoteXmr(cents: number, discount: number, price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid Monero price');
  }

  if (!Number.isSafeInteger(cents) || cents <= 0 || !Number.isSafeInteger(discount) || discount < 0 || discount >= 100) {
    throw new Error('Invalid invoice price');
  }

  const scaledPrice = parseXmr(price.toFixed(12));

  if (!scaledPrice) {
    throw new Error('Monero price is below supported precision');
  }

  const numerator = BigInt(cents) * BigInt(100 - discount) * 1_000_000_000_000n * 1_000_000_000_000n;
  const denominator = scaledPrice * 10_000n;
  const atoms = (numerator + denominator - 1n) / denominator;

  return `${atoms / 1_000_000_000_000n}.${(atoms % 1_000_000_000_000n).toString().padStart(12, '0')}`;
}

export function invoiceState(total: bigint, unlocked: bigint, required: bigint, expiresAt: number, firstFullPaymentAt: number | null, now: number) {
  if (required <= 0n || total < 0n || unlocked < 0n || unlocked > total) {
    throw new Error('Invalid invoice balance');
  }

  if (firstFullPaymentAt !== null && firstFullPaymentAt > expiresAt) {
    return 'late';
  }

  if (unlocked >= required) {
    return 'paid';
  }

  if (total >= required) {
    return 'confirming';
  }

  if (total > 0n) {
    return 'underpaid';
  }

  return now >= expiresAt ? 'expired' : 'pending';
}

export async function withBillingWallet<T>(operation: (connection: ReservedSql) => Promise<T>, existing?: ReservedSql): Promise<T> {
  requireProvider(cryptoBillingEnabled && !!moneroWallet.address && !!moneroWallet.viewKey && !!moneroWallet.password, 'Crypto billing');

  const connection = existing || (await sql.reserve());

  let locked = false;

  try {
    const lock = await connection`SELECT pg_try_advisory_lock(81472631) AS acquired`;
    locked = lock[0].acquired;

    if (!locked) {
      throw new Error('Crypto billing is busy. Retry this request shortly');
    }

    await initMoneroWallet(connection);

    const result = await operation(connection);
    billingReadiness.available = true;

    return result;
  } catch (error) {
    if (locked) {
      loadedRevision = null;
      billingReadiness.available = false;
    }

    throw error;
  } finally {
    try {
      if (locked) {
        await connection`SELECT pg_advisory_unlock(81472631)`;
      }
    } finally {
      if (!existing) {
        connection.release();
      }
    }
  }
}

export async function allocateInvoiceAddress(id: string, connection: ReservedSql) {
  return withBillingWallet(async (connection) => {
    const subaddresses = await watchWallet.getSubaddresses(0);

    const existing = subaddresses.find((address) => address.getLabel() === id);
    const subaddress = existing || (await watchWallet.createSubaddress(0, id));

    if (!existing) {
      await saveWalletState(connection);
    }

    return subaddress.getAddress();
  }, connection);
}
