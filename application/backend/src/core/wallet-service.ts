import {watchWallet, setWatchWallet} from '@core/states';
import {XMR_NODE, RESTORE_HEIGHT} from '@core/constants';
import {moneroWallet} from '@core/config';
import {sql} from '@core/services';
import moneroTs from 'monero-ts';

export async function initMoneroWallet() {
  const cacheQuery = await sql`SELECT keys_data, cache_data FROM wallet_cache WHERE id = 1`;

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
    await saveWalletState();
  }
}

export async function saveWalletState() {
  if (!watchWallet) return;
  const data = await watchWallet.getData();
  const keysBuffer = Buffer.from(data[0].buffer, data[0].byteOffset, data[0].byteLength);
  const cacheBuffer = Buffer.from(data[1].buffer, data[1].byteOffset, data[1].byteLength);

  await sql`
    INSERT INTO wallet_cache (id, keys_data, cache_data)
    VALUES (1, ${keysBuffer}, ${cacheBuffer})
    ON CONFLICT (id) DO UPDATE SET
      keys_data = EXCLUDED.keys_data,
      cache_data = EXCLUDED.cache_data
  `;
}

export function parseXmr(value: string) {
  if (!/^\d+(?:\.\d{1,12})?$/.test(value)) throw new Error('Invalid Monero amount');
  const [whole, fraction = ''] = value.split('.');

  return BigInt(whole) * 1_000_000_000_000n + BigInt(fraction.padEnd(12, '0'));
}

export function quoteXmr(cents: number, discount: number, price: number) {
  if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid Monero price');
  const scaledPrice = parseXmr(price.toFixed(12));
  const numerator = BigInt(cents) * BigInt(100 - discount) * 1_000_000_000_000n * 1_000_000_000_000n;
  const denominator = scaledPrice * 10_000n;
  const atoms = (numerator + denominator - 1n) / denominator;

  return `${atoms / 1_000_000_000_000n}.${(atoms % 1_000_000_000_000n).toString().padStart(12, '0')}`;
}

export function invoiceState(total: bigint, unlocked: bigint, required: bigint, expiresAt: number, firstPaymentAt: number | null, now: number) {
  if (required <= 0n || total < 0n || unlocked < 0n || unlocked > total) throw new Error('Invalid invoice balance');
  if (firstPaymentAt !== null && firstPaymentAt > expiresAt) return 'late';
  if (unlocked >= required) return 'paid';
  if (total >= required) return 'confirming';
  if (total > 0n) return 'underpaid';

  return now >= expiresAt ? 'expired' : 'pending';
}

export async function withBillingWallet<T>(operation: () => Promise<T>): Promise<T> {
  const connection = await sql.reserve();

  try {
    await connection`SELECT pg_advisory_lock(81472631)`;
    if (watchWallet) await watchWallet.close().catch(() => {});
    await initMoneroWallet();

    return await operation();
  } finally {
    await connection`SELECT pg_advisory_unlock(81472631)`;
    connection.release();
  }
}

export async function allocateInvoiceAddress(id: string) {
  return withBillingWallet(async () => {
    const subaddress = await watchWallet.createSubaddress(0, id);
    await saveWalletState();

    return subaddress.getAddress();
  });
}
