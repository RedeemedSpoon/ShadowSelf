import {
  BTC_API,
  ETH_API,
  UTXO_GAP_LIMIT,
  UTXO_HARD_LIMIT,
  UTXO_RECOVERY_LIMIT,
  CHAIN_REQUEST_CONCURRENCY,
  LTC_API,
  USDT_CONTRACT,
  XMR_NODE,
} from '@core/constants';
import type {CryptoWalletResponse, UTXOData, TransactionsHistory, UtxoProviderTransaction, EvmProviderTransaction, WalletScanOptions} from '@type';
import {xpubToAddress} from '@utils/cryptography';
import {ApiError} from '@core/security';

export async function mapChainRequests<T, R>(items: T[], operation: (item: T, index: number) => Promise<R>, signal?: AbortSignal): Promise<R[]> {
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

export function aggregateWalletHistory(transactions: UtxoProviderTransaction[], addresses: Set<string>): TransactionsHistory {
  const unique = new Map(transactions.map((transaction) => [transaction.txid, transaction]));

  return [...unique.values()]
    .map((transaction) => {
      const spent = transaction.vin.reduce((sum, input) => sum + (addresses.has(input.prevout?.scriptpubkey_address || '') ? input.prevout!.value : 0), 0);
      const received = transaction.vout.reduce((sum, output) => sum + (addresses.has(output.scriptpubkey_address) ? output.value : 0), 0);
      const external =
        spent > 0
          ? transaction.vout.filter((output) => !addresses.has(output.scriptpubkey_address)).map((output) => output.scriptpubkey_address)
          : transaction.vin
              .filter((input) => !addresses.has(input.prevout?.scriptpubkey_address || ''))
              .map((input) => input.prevout?.scriptpubkey_address || 'Unknown');
      const counterparties = [...new Set(external)];

      return {
        txid: transaction.txid,
        type: received > spent ? ('received' as const) : ('sent' as const),
        amount: Math.abs(received - spent) / 100_000_000,
        date: new Date(transaction.status.block_time ? transaction.status.block_time * 1000 : Date.now()),
        counterparty: counterparties.length === 0 ? 'Internal transfer' : counterparties.length === 1 ? counterparties[0] : 'Multiple',
      };
    })
    .sort((left, right) => right.date.getTime() - left.date.getTime());
}

export async function getUtxoData(
  coin: 'btc' | 'ltc',
  xpub: string,
  fetcher: typeof fetch = fetch,
  options: WalletScanOptions = {},
): Promise<CryptoWalletResponse['btc']> {
  const baseUrl = coin === 'btc' ? BTC_API : LTC_API;
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(options.recovery ? 120_000 : 25_000), ...(options.signal ? [options.signal] : [])]);
  const limit = options.recovery ? UTXO_RECOVERY_LIMIT : UTXO_HARD_LIMIT;
  const addresses = new Set<string>();
  const utxos: UTXOData = [];
  const transactions: UtxoProviderTransaction[] = [];
  let balanceAtoms = 0;
  let activeCount = 0;
  let scanned = 0;
  let gap = 0;
  let normalScanEnd: number | undefined;

  async function read(path: string) {
    const response = await fetcher(`${baseUrl}${path}`, {signal});

    if (!response.ok) {
      throw new Error('Wallet provider is unavailable');
    }

    return response.json();
  }

  try {
    for (let start = 0; start < limit; start += CHAIN_REQUEST_CONCURRENCY) {
      const indices = Array.from({length: Math.min(CHAIN_REQUEST_CONCURRENCY, limit - start)}, (_, offset) => start + offset);
      const batch = await mapChainRequests(
        indices,
        async (index) => {
          const address = xpubToAddress(coin, xpub, index);
          const info = await read(`/address/${address}`);

          for (const stats of [info.chain_stats, info.mempool_stats]) {
            if (!stats || !['tx_count', 'funded_txo_sum', 'spent_txo_sum'].every((field) => Number.isSafeInteger(stats[field]) && stats[field] >= 0)) {
              throw new Error('Invalid address response');
            }
          }

          return {index, address, info};
        },
        signal,
      );

      for (const {index, address, info} of batch) {
        addresses.add(address);
        scanned = index + 1;

        if (info.chain_stats.tx_count + info.mempool_stats.tx_count === 0) {
          gap++;
          continue;
        }

        gap = 0;
        activeCount = index + 1;
        balanceAtoms += info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum + info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum;
      }

      const active = batch.filter(({info}) => info.chain_stats.tx_count + info.mempool_stats.tx_count > 0);
      const details = await mapChainRequests(
        active.flatMap((entry) => [
          {...entry, kind: 'utxo'},
          {...entry, kind: 'txs'},
        ]),
        async (entry) => ({...entry, data: await read(`/address/${entry.address}/${entry.kind}`)}),
        signal,
      );

      for (const {index, address, kind, data} of details) {
        if (!Array.isArray(data)) {
          throw new Error('Invalid wallet response');
        }

        if (kind === 'utxo') {
          if (
            data.some(
              (item) =>
                !/^[a-f0-9]{64}$/i.test(item.txid) || !Number.isSafeInteger(item.vout) || item.vout < 0 || !Number.isSafeInteger(item.value) || item.value < 0,
            )
          ) {
            throw new Error('Invalid unspent outputs');
          }

          utxos.push(...data.map((item) => ({...item, address, pathIndex: index})));
        } else {
          if (
            data.some(
              (item) =>
                !/^[a-f0-9]{64}$/i.test(item.txid) ||
                !Array.isArray(item.vin) ||
                !Array.isArray(item.vout) ||
                !item.status ||
                [...item.vout, ...item.vin.flatMap((input: {prevout?: unknown}) => (input.prevout ? [input.prevout] : []))].some(
                  (output) => !Number.isSafeInteger(output.value) || output.value < 0,
                ),
            )
          ) {
            throw new Error('Invalid transaction history');
          }

          transactions.push(...data);
        }
      }

      if (gap >= UTXO_GAP_LIMIT) {
        normalScanEnd ??= scanned;

        if (!options.recovery) {
          break;
        }
      }
    }

    if (!Number.isSafeInteger(balanceAtoms) || balanceAtoms < 0) {
      throw new Error('Invalid wallet balance');
    }

    const complete = gap >= UTXO_GAP_LIMIT && activeCount < UTXO_HARD_LIMIT && activeCount <= (normalScanEnd ?? scanned);

    return {
      status: complete ? 'Synced' : 'Incomplete',
      balance: balanceAtoms / 100_000_000,
      utxos,
      history: aggregateWalletHistory(transactions, addresses),
      activeCount,
      nextIndex: complete ? activeCount : null,
      scanned,
      scanLimit: limit,
      error: complete
        ? undefined
        : 'Address discovery is incomplete or activity extends beyond the normal scan range. The displayed balance may be incomplete. New addresses are disabled.',
    };
  } catch (cause) {
    controller.abort();
    throw new Error(`${coin.toUpperCase()} wallet data is unavailable`, {cause});
  }
}

export function aggregateEvmHistory(transactions: EvmProviderTransaction[], address: string, decimals: number): TransactionsHistory {
  const owned = address.toLowerCase();
  const entries = new Map<string, {transaction: EvmProviderTransaction; net: bigint; counterparties: Set<string>}>();

  for (const transaction of transactions) {
    if (
      !/^0x[a-f0-9]{64}$/i.test(transaction.hash) ||
      !/^0x[a-f0-9]{40}$/i.test(transaction.from) ||
      (transaction.to !== null && transaction.to !== '' && !/^0x[a-f0-9]{40}$/i.test(transaction.to)) ||
      !/^\d+$/.test(transaction.value) ||
      !/^\d+$/.test(transaction.timeStamp)
    ) {
      throw new Error('Invalid Ethereum transaction history');
    }

    if (transaction.isError === '1' || transaction.txreceipt_status === '0') {
      continue;
    }

    const entry = entries.get(transaction.hash) ?? {transaction, net: 0n, counterparties: new Set<string>()};
    const amount = BigInt(transaction.value);
    const incoming = transaction.to?.toLowerCase() === owned;
    const outgoing = transaction.from.toLowerCase() === owned;
    entry.net += (incoming ? amount : 0n) - (outgoing ? amount : 0n);

    if (incoming && !outgoing) {
      entry.counterparties.add(transaction.from);
    } else if (outgoing && !incoming) {
      entry.counterparties.add(transaction.to || 'Contract creation');
    }

    entries.set(transaction.hash, entry);
  }

  return [...entries.values()]
    .map(({transaction, net, counterparties}) => {
      const amount = Math.abs(Number(net)) / 10 ** decimals;
      const date = new Date(Number(transaction.timeStamp) * 1000);

      if (!Number.isFinite(amount) || !Number.isFinite(date.getTime())) {
        throw new Error('Invalid Ethereum transaction values');
      }

      return {
        txid: transaction.hash,
        type: net > 0n ? ('received' as const) : ('sent' as const),
        amount,
        date,
        counterparty: counterparties.size === 0 ? 'Internal transfer' : counterparties.size === 1 ? [...counterparties][0] : 'Multiple',
      };
    })
    .sort((left, right) => right.date.getTime() - left.date.getTime());
}

export async function getEvmData(coin: 'eth' | 'usdt', address: string, fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  const ethBalanceUrl = `${ETH_API}?module=account&action=balance&address=${address}`;
  const usdtbalanceUrl = `${ETH_API}?module=account&action=tokenbalance&contractaddress=${USDT_CONTRACT}&address=${address}`;
  const balanceUrl = coin === 'eth' ? ethBalanceUrl : usdtbalanceUrl;

  const nonceUrl = `${ETH_API}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=pending`;
  const historyUrl = `${ETH_API}?module=account&action=${coin === 'eth' ? 'txlist' : 'tokentx'}&address=${address}${coin === 'usdt' ? `&contractaddress=${USDT_CONTRACT}` : ''}&sort=desc&page=1&offset=50`;

  try {
    const [balRes, nonceRes, histRes] = await Promise.all(
      [balanceUrl, nonceUrl, historyUrl].map((url) => fetcher(url, {signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])])})),
    );

    if (![balRes, nonceRes, histRes].every((response) => response.ok)) {
      throw new Error('Wallet provider is unavailable');
    }

    const balData = await balRes.json();

    const nonceData = await nonceRes.json();

    const histData = await histRes.json();

    if (balData.status !== '1' || !/^\d+$/.test(balData.result) || !/^0x[0-9a-f]+$/i.test(nonceData.result)) {
      throw new Error('Invalid wallet balance or nonce');
    }

    const balance = Number(balData.result) / (coin === 'eth' ? 1e18 : 1e6);
    const nonce = Number(BigInt(nonceData.result));

    if (!Number.isFinite(balance) || balance < 0 || !Number.isSafeInteger(nonce)) {
      throw new Error('Invalid wallet values');
    }

    if (!Array.isArray(histData.result) || (histData.status !== '1' && !(histData.status === '0' && histData.result.length === 0))) {
      throw new Error('Invalid wallet history');
    }

    const history = aggregateEvmHistory(histData.result, address, coin === 'usdt' ? 6 : 18);

    return {status: 'Synced', balance, balanceAtoms: BigInt(balData.result).toString(), nonce, history};
  } catch (cause) {
    throw new Error(`${coin.toUpperCase()} wallet data is unavailable`, {cause});
  }
}

export async function getXmrNode(fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher(XMR_NODE, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_info'}),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error('Monero node is unavailable');
    }

    const data = await response.json();

    const info = data.result;

    if (data.error || !info || typeof info.status !== 'string' || !Number.isSafeInteger(info.height) || !Number.isSafeInteger(info.target_height)) {
      throw new Error('Invalid Monero node response');
    }

    let status = 'Network Operational';

    if (info.status !== 'OK') {
      status = 'Node Busy';
    }

    if (info.offline) {
      status = 'Node Offline';
    }

    if (info.target_height > 0 && info.target_height - info.height > 5) {
      status = `Syncing (${info.height}/${info.target_height})`;
    }

    return {status, nodeUrl: XMR_NODE};
  } catch {
    throw new ApiError(503, 'chain_unavailable', 'The Monero node is unavailable');
  }
}
