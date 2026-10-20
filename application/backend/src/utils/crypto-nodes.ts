import type {CryptoWalletResponse, UTXOData, UtxoProviderTransaction, WalletScanOptions} from '@type';
import {xpubToAddress} from '@utils/cryptography';
import {ApiError} from '@core/security';
import {chainRequest, withChainEndpoint, moneroNodeInfo} from '@core/chain-requests';
import {
  aggregateWalletHistory,
  validateUtxoHistory,
  nextUtxoHistory,
  sealHistoryCursor,
  historyKey,
} from '@core/wallet-history';
import {UTXO_GAP_LIMIT, UTXO_HARD_LIMIT, UTXO_RECOVERY_LIMIT, CHAIN_REQUEST_CONCURRENCY} from '@core/constants';

export async function mapChainRequests<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  await Promise.all(
    Array.from({length: Math.min(CHAIN_REQUEST_CONCURRENCY, items.length)}, async () => {
      while (next < items.length) {
        signal?.throwIfAborted();
        const index = next++;
        results[index] = await operation(items[index], index);
      }
    }),
  );

  return results;
}

export async function getUtxoData(
  coin: 'btc' | 'ltc',
  xpub: string,
  endpoint: string,
  fetcher: typeof fetch = fetch,
  options: WalletScanOptions = {},
): Promise<CryptoWalletResponse['btc']> {
  const controller = new AbortController();
  const signal = AbortSignal.any([
    controller.signal,
    AbortSignal.timeout(options.recovery ? 120_000 : 25_000),
    ...(options.signal ? [options.signal] : []),
  ]);
  const issued = options.issued ?? {receive: -1, change: -1};
  const discoveryLimit = options.recovery ? UTXO_RECOVERY_LIMIT : UTXO_HARD_LIMIT;
  const limits = [issued.receive, issued.change].map((index) => Math.max(discoveryLimit, index + UTXO_GAP_LIMIT + 1));
  const addresses = new Set<string>();
  const utxos: UTXOData = [];
  const transactions: UtxoProviderTransaction[] = [];
  const after: import('@type').UtxoHistoryCursor['after'] = [];
  const counts: [number, number] = [0, 0];
  let historyError: string | undefined;
  let mempoolLimited = false;
  const nextIndices: (number | null)[] = [];
  const discovered = {...issued};
  let scanned = 0;
  let activeCount = 0;

  async function read(path: string) {
    const response = await chainRequest(`${endpoint}${path}`, {signal}, fetcher);

    if (!response.ok) {
      throw new Error('Wallet provider is unavailable');
    }

    return response.json();
  }

  try {
    for (const branch of [0, 1] as const) {
      const knownIndex = branch === 0 ? issued.receive : issued.change;
      const limit = limits[branch];
      let gap = 0;
      let lastActive = -1;

      for (let start = 0; start < limit; start += CHAIN_REQUEST_CONCURRENCY) {
        const indices = Array.from(
          {length: Math.min(CHAIN_REQUEST_CONCURRENCY, limit - start)},
          (_, offset) => start + offset,
        );
        const batch = await mapChainRequests(
          indices,
          async (index) => {
            const address = xpubToAddress(coin, xpub, index, branch);
            const info = await read(`/address/${address}`);

            for (const stats of [info.chain_stats, info.mempool_stats]) {
              if (
                !stats ||
                !['tx_count', 'funded_txo_sum', 'spent_txo_sum'].every(
                  (field) => Number.isSafeInteger(stats[field]) && stats[field] >= 0,
                )
              ) {
                throw new Error('Invalid address response');
              }
            }

            return {index, address, info};
          },
          signal,
        );

        for (const {index, address, info} of batch) {
          addresses.add(address);
          scanned++;
          counts[branch] = index + 1;

          if (info.chain_stats.tx_count + info.mempool_stats.tx_count === 0) {
            gap++;
            continue;
          }

          gap = 0;
          lastActive = index;
          activeCount++;
        }

        const active = batch.filter(({info}) => info.chain_stats.tx_count + info.mempool_stats.tx_count > 0);
        const details = await mapChainRequests(
          active.flatMap((entry) => [
            {...entry, kind: 'utxo'},
            {...entry, kind: 'txs'},
          ]),
          async (entry) => {
            try {
              const data = await read(`/address/${entry.address}/${entry.kind}`);

              return {...entry, data};
            } catch (failure) {
              if (entry.kind === 'utxo') {
                throw failure;
              }

              return {...entry, data: null};
            }
          },
          signal,
        );

        for (const {index, address, kind, data, info} of details) {
          if (kind === 'utxo') {
            if (
              !Array.isArray(data) ||
              data.some(
                (item) =>
                  !/^[a-f0-9]{64}$/i.test(item.txid) ||
                  !Number.isSafeInteger(item.vout) ||
                  item.vout < 0 ||
                  !Number.isSafeInteger(item.value) ||
                  item.value < 0,
              )
            ) {
              throw new Error('Invalid unspent outputs');
            }

            utxos.push(...data.map((item) => ({...item, address, pathIndex: index, branch})));
          } else {
            try {
              const page = validateUtxoHistory(data);
              const confirmed = page.filter((transaction) => transaction.status.confirmed).length;

              if (confirmed < Math.min(25, info.chain_stats.tx_count)) {
                throw new Error('History is still indexing');
              }

              transactions.push(...page);
              mempoolLimited ||= info.mempool_stats.tx_count > 50;
              const txid = nextUtxoHistory(page);

              if (txid) {
                after.push({branch, index, txid, remaining: Math.max(0, info.chain_stats.tx_count - confirmed)});
              }
            } catch {
              after.push({branch, index, txid: null, remaining: info.chain_stats.tx_count});
              historyError = 'Some transaction history is unavailable. Retry loading the remaining history.';
            }
          }
        }

        const batchEnd = start + batch.length - 1;

        if (gap >= UTXO_GAP_LIMIT && batchEnd >= knownIndex + UTXO_GAP_LIMIT && !options.recovery) {
          break;
        }
      }

      discovered[branch === 0 ? 'receive' : 'change'] = Math.max(lastActive, knownIndex);
      nextIndices[branch] = gap >= UTXO_GAP_LIMIT ? Math.max(lastActive, knownIndex) + 1 : null;
    }

    const outputs = new Set(utxos.map((output) => `${output.txid}:${output.vout}`));

    if (outputs.size !== utxos.length) {
      throw new Error('The provider returned duplicate unspent outputs');
    }

    const balanceAtoms = utxos.reduce((sum, output) => sum + output.value, 0);

    if (!Number.isSafeInteger(balanceAtoms) || balanceAtoms < 0) {
      throw new Error('Invalid wallet balance');
    }

    const complete = nextIndices.every((index) => index !== null);

    return {
      status: complete ? 'Synced' : 'Incomplete',
      balance: balanceAtoms / 100_000_000,
      utxos,
      history: aggregateWalletHistory(transactions, addresses),
      historyCursor: after.length
        ? sealHistoryCursor({kind: 'utxo', coin, key: historyKey(xpub), endpoint, counts, after, mempoolLimited})
        : null,
      historyError: mempoolLimited
        ? 'The provider limits unconfirmed history to 50 transactions per address.'
        : historyError,
      activeCount,
      discovered,
      nextReceiveIndex: complete ? nextIndices[0] : null,
      nextChangeIndex: complete ? nextIndices[1] : null,
      scanned,
      scanLimit: limits.reduce((sum, limit) => sum + limit, 0),
      error: complete
        ? undefined
        : 'Address discovery is incomplete or activity extends beyond the normal scan range. The displayed balance may be incomplete. New addresses are disabled.',
    };
  } catch {
    controller.abort();
    throw new ApiError(503, 'chain_unavailable', `${coin.toUpperCase()} wallet data is unavailable. Retry the scan`);
  }
}

export async function getXmrNode(fetcher: typeof fetch = fetch) {
  return withChainEndpoint('xmr', async (endpoint, signal) => {
    await moneroNodeInfo(endpoint, signal, fetcher);

    return {status: 'Network Operational', nodeUrl: endpoint};
  });
}
