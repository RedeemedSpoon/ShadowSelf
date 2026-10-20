import {sql} from '@core/services';
import {billingWallet, cryptoPrices, billingReadiness} from '@core/states';
import {withBillingWallet, saveWalletState, quoteUsdXmr, parseXmr} from '@core/wallet-service';
import {CRYPTO_REFUND_CONFIRMATIONS, REFUND_WINDOW_MS, POLL_PRICES_INTERVAL} from '@core/constants';
import {ApiError, decryptSecret, encryptSecret} from '@core/security';
import {withReservedTransaction, reportFailure} from '@utils/utils';
import type {CryptoRefund} from '@type';
import type {ReservedSql, TransactionSql} from 'postgres';
import moneroTs from 'monero-ts';

export async function validateRefundAddress(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (
    typeof value !== 'string' ||
    value.length > 106 ||
    !(await moneroTs.MoneroUtils.isValidAddress(value, moneroTs.MoneroNetworkType.MAINNET))
  ) {
    throw new ApiError(400, 'invalid_refund_address', 'Enter a valid mainnet Monero refund address');
  }

  return value;
}

export async function identityCryptoRefund(
  id: string,
  owner: number,
  database: typeof sql | ReservedSql | TransactionSql = sql,
) {
  const invoices =
    await database`SELECT c.id, c.usd_amount FROM crypto_invoices c JOIN identities i ON c.identity_id = i.id
    WHERE i.id = ${id} AND i.owner = ${owner} AND c.owner = ${owner} AND NOT c.renewal AND c.status = 'paid'
    AND i.creation_date <= NOW() AND i.creation_date >= NOW() - ${REFUND_WINDOW_MS} * INTERVAL '1 millisecond'`;

  return invoices[0] as {id: string; usd_amount: string} | undefined;
}

export async function queueCryptoRefund(
  id: string,
  owner: number,
  address: string | undefined,
  database: ReservedSql | TransactionSql,
) {
  const invoice = await identityCryptoRefund(id, owner, database);

  if (!invoice) {
    return;
  }

  if (!address) {
    throw new ApiError(
      400,
      'refund_address_required',
      'A Monero refund address is required for this eligible crypto purchase',
    );
  }

  await database`INSERT INTO crypto_refunds (invoice_id, owner, destination_encrypted)
    VALUES (${invoice.id}, ${owner}, ${encryptSecret(address)}) ON CONFLICT (invoice_id) DO NOTHING`;
}

export async function repairCryptoRefunds() {
  return withBillingWallet((connection) => processCryptoRefunds(connection));
}

export async function processCryptoRefunds(connection: ReservedSql, wallet = billingWallet) {
  const prepared = await connection`SELECT r.*, c.usd_amount FROM crypto_refunds r
    JOIN crypto_invoices c ON c.id = r.invoice_id WHERE r.metadata_encrypted IS NOT NULL
    ORDER BY r.requested_at LIMIT 1`;

  if (prepared[0]) {
    if (new Date(prepared[0].retry_at).getTime() <= Date.now()) {
      await processRefund(prepared[0] as CryptoRefund, connection, wallet);
    }

    return;
  }

  const pending = await connection`SELECT r.*, c.usd_amount FROM crypto_refunds r
    JOIN crypto_invoices c ON c.id = r.invoice_id WHERE r.retry_at <= NOW() ORDER BY r.requested_at LIMIT 1`;

  if (pending[0]) {
    await processRefund(pending[0] as CryptoRefund, connection, wallet);
  }
}

async function processRefund(refund: CryptoRefund, connection: ReservedSql, wallet: moneroTs.MoneroWalletFull) {
  let code = 'refund_pending';

  try {
    await wallet.sync();

    if (!refund.metadata_encrypted) {
      await prepareRefund(refund, connection, wallet);
    }

    const transactions = await wallet.getTxs({hashes: [refund.tx_hash!]});
    const transaction = transactions.find((entry) => entry.getHash() === refund.tx_hash);

    if (
      transaction?.getIsConfirmed() &&
      !transaction.getIsFailed() &&
      !transaction.getIsDoubleSpendSeen() &&
      transaction.getNumConfirmations() >= CRYPTO_REFUND_CONFIRMATIONS
    ) {
      await completeRefund(refund, connection, wallet);

      return;
    }

    if (!transaction?.getInTxPool() && !transaction?.getIsConfirmed()) {
      const hash = await wallet.relayTx(decryptSecret(refund.metadata_encrypted!));

      if (hash !== refund.tx_hash) {
        throw new Error('The wallet relayed a different refund transaction');
      }
    }

    await saveWalletState(connection, wallet);
  } catch (failure) {
    code =
      failure instanceof ApiError
        ? failure.code
        : refund.metadata_encrypted
          ? 'broadcast_uncertain'
          : 'wallet_unavailable';
    reportFailure('Crypto refund', failure);
  }

  const delay = Math.min(3600, 15 * 2 ** Math.min(refund.attempts, 8));
  await connection`UPDATE crypto_refunds SET retry_at = ${new Date(Date.now() + delay * 1000)},
    attempts = attempts + 1, error_code = ${code} WHERE id = ${refund.id}`;
}

async function prepareRefund(refund: CryptoRefund, connection: ReservedSql, wallet: moneroTs.MoneroWalletFull) {
  const price = cryptoPrices.xmr?.usdPrice;

  if (!price || Date.now() - billingReadiness.priceSync > POLL_PRICES_INTERVAL * 3) {
    throw new ApiError(503, 'price_unavailable', 'A current XMR exchange rate is required before signing the refund');
  }

  const amount = quoteUsdXmr(refund.usd_amount, price);
  const settled = await connection`SELECT id FROM crypto_invoices WHERE status IN ('paid', 'refunded')`;
  const invoiceIDs = new Set(settled.map((invoice) => invoice.id));
  const subaddresses = await wallet.getSubaddresses(0);
  const sources = subaddresses
    .filter((address) => address.getIndex() === 0 || invoiceIDs.has(address.getLabel()))
    .map((address) => address.getIndex());

  if (!sources.includes(0)) {
    throw new Error('The billing treasury subaddress is missing');
  }

  const transaction = await wallet.createTx({
    accountIndex: 0,
    subaddressIndices: sources,
    address: decryptSecret(refund.destination_encrypted),
    amount: parseXmr(amount),
    relay: false,
    canSplit: false,
    priority: 1,
  });
  const hash = transaction.getHash();
  const metadata = transaction.getMetadata();

  if (!/^[a-f0-9]{64}$/i.test(hash || '') || typeof metadata !== 'string' || !metadata) {
    throw new Error('The wallet did not create a signed refund');
  }

  const sealed = encryptSecret(metadata);
  await withReservedTransaction(connection, async (database) => {
    await database`UPDATE crypto_refunds SET xmr_amount = ${amount}, tx_hash = ${hash}, metadata_encrypted = ${sealed}
      WHERE id = ${refund.id}`;
    await saveWalletState(database, wallet);
  });

  refund.xmr_amount = amount;
  refund.tx_hash = hash;
  refund.metadata_encrypted = sealed;
}

async function completeRefund(refund: CryptoRefund, connection: ReservedSql, wallet: moneroTs.MoneroWalletFull) {
  await withReservedTransaction(connection, async (database) => {
    await saveWalletState(database, wallet);
    await database`UPDATE crypto_invoices SET status = 'refunded', owner = NULL, identity_id = NULL,
      xmr_subaddress = NULL, refund_address = NULL, provider_reference = NULL, provider_state = NULL, response = NULL
      WHERE id = ${refund.invoice_id}`;
    await database`DELETE FROM invoice_observations WHERE invoice_id = ${refund.invoice_id}`;
    await database`DELETE FROM invoice_transfers WHERE invoice_id = ${refund.invoice_id}`;
    await database`DELETE FROM crypto_refunds WHERE id = ${refund.id}`;
  });
}
