import {encryptSecret, decryptSecret, ApiError} from '@core/security';
import {chainEndpoints} from '@core/config';
import {chainJson, withChainEndpoint} from '@core/providers/chain-requests';
import {ESPLORA_HISTORY_PAGE_SIZE, WALLET_HISTORY_PAGE_SIZE, USDT_CONTRACT} from '@core/constants';
import {xpubToAddress} from '@utils/cryptography';
import {createHash} from 'node:crypto';
import type {
  TransactionsHistory,
  UtxoProviderTransaction,
  EvmProviderTransaction,
  WalletHistoryPage,
  UtxoHistoryCursor,
  EvmHistoryCursor,
  EvmHistoryGroup,
} from '@type';

export function aggregateWalletHistory(
  transactions: UtxoProviderTransaction[],
  addresses: Set<string>,
): TransactionsHistory {
  const unique = new Map(transactions.map((transaction) => [transaction.txid, transaction]));

  return [...unique.values()]
    .map((transaction) => {
      const spent = transaction.vin.reduce(
        (sum, input) => sum + (addresses.has(input.prevout?.scriptpubkey_address || '') ? input.prevout!.value : 0),
        0,
      );
      const received = transaction.vout.reduce(
        (sum, output) => sum + (addresses.has(output.scriptpubkey_address) ? output.value : 0),
        0,
      );
      const external =
        spent > 0
          ? transaction.vout
              .filter((output) => !addresses.has(output.scriptpubkey_address))
              .map((output) => output.scriptpubkey_address)
          : transaction.vin
              .filter((input) => !addresses.has(input.prevout?.scriptpubkey_address || ''))
              .map((input) => input.prevout?.scriptpubkey_address || 'Unknown');
      const counterparties = [...new Set(external)];

      return {
        txid: transaction.txid,
        type: received > spent ? ('received' as const) : ('sent' as const),
        amount: Math.abs(received - spent) / 100_000_000,
        date: new Date(transaction.status.block_time ? transaction.status.block_time * 1000 : Date.now()),
        counterparty:
          counterparties.length === 0
            ? 'Internal transfer'
            : counterparties.length === 1
              ? counterparties[0]
              : 'Multiple',
      };
    })
    .sort((left, right) => right.date.getTime() - left.date.getTime());
}

function evmHistoryGroups(transactions: EvmProviderTransaction[], address: string, carry?: EvmHistoryGroup) {
  const owned = address.toLowerCase();
  const groups = new Map<string, EvmHistoryGroup>();

  if (carry) {
    groups.set(carry.hash, {...carry, counterparties: [...carry.counterparties]});
  }

  for (const transaction of transactions) {
    if (
      !/^0x[a-f0-9]{64}$/i.test(transaction.hash || '') ||
      !/^0x[a-f0-9]{40}$/i.test(transaction.from) ||
      (transaction.to !== null && transaction.to !== '' && !/^0x[a-f0-9]{40}$/i.test(transaction.to)) ||
      !/^\d+$/.test(transaction.value) ||
      !/^\d+$/.test(transaction.timeStamp)
    ) {
      throw new ApiError(502, 'invalid_chain_data', 'The explorer returned invalid transaction history');
    }

    if (transaction.isError === '1' || transaction.txreceipt_status === '0') {
      continue;
    }

    const group = groups.get(transaction.hash) ?? {
      hash: transaction.hash,
      timestamp: transaction.timeStamp,
      net: '0',
      counterparties: [],
    };
    const incoming = transaction.to?.toLowerCase() === owned;
    const outgoing = transaction.from.toLowerCase() === owned;
    const amount = BigInt(transaction.value);
    group.net = (BigInt(group.net) + (incoming ? amount : 0n) - (outgoing ? amount : 0n)).toString();
    const counterparty =
      incoming && !outgoing ? transaction.from : outgoing && !incoming ? transaction.to || 'Contract creation' : null;

    if (counterparty && !group.counterparties.includes(counterparty)) {
      group.counterparties.push(counterparty);
    }

    groups.set(transaction.hash, group);
  }

  return [...groups.values()];
}

function evmHistoryEntry(group: EvmHistoryGroup, decimals: number): TransactionsHistory[number] {
  const net = BigInt(group.net);
  const amount = Math.abs(Number(net)) / 10 ** decimals;
  const date = new Date(Number(group.timestamp) * 1000);

  if (!Number.isFinite(amount) || !Number.isFinite(date.getTime())) {
    throw new ApiError(502, 'invalid_chain_data', 'The explorer returned invalid transaction values');
  }

  return {
    txid: group.hash,
    type: net > 0n ? 'received' : 'sent',
    amount,
    date,
    counterparty: !group.counterparties.length
      ? 'Internal transfer'
      : group.counterparties.length === 1
        ? group.counterparties[0]
        : 'Multiple',
  };
}

export function historyKey(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function sealHistoryCursor(cursor: UtxoHistoryCursor | EvmHistoryCursor) {
  return encryptSecret(JSON.stringify(cursor));
}

export function openHistoryCursor(value: unknown, coin: string, key: string) {
  try {
    if (typeof value !== 'string' || value.length > 500_000) {
      throw new Error('Invalid cursor');
    }

    const cursor = JSON.parse(decryptSecret(value)) as UtxoHistoryCursor | EvmHistoryCursor;
    const network = coin === 'btc' || coin === 'ltc' ? coin : 'eth';

    if (
      cursor.kind !== (coin === 'btc' || coin === 'ltc' ? 'utxo' : 'evm') ||
      cursor.coin !== coin ||
      cursor.key !== historyKey(coin === 'eth' || coin === 'usdt' ? key.toLowerCase() : key) ||
      !chainEndpoints[network].includes(cursor.endpoint)
    ) {
      throw new Error('History scope changed');
    }

    return cursor;
  } catch {
    throw new ApiError(400, 'invalid_history_cursor', 'This history page is no longer valid. Refresh the wallet');
  }
}

export function validateUtxoHistory(data: unknown): UtxoProviderTransaction[] {
  if (
    !Array.isArray(data) ||
    data.some(
      (item) =>
        !item ||
        !/^[a-f0-9]{64}$/i.test(item.txid) ||
        !Array.isArray(item.vin) ||
        !Array.isArray(item.vout) ||
        typeof item.status?.confirmed !== 'boolean' ||
        [
          ...item.vout,
          ...item.vin.flatMap((input: {prevout?: unknown}) => (input.prevout ? [input.prevout] : [])),
        ].some((output) => !output || !Number.isSafeInteger(output.value) || output.value < 0),
    )
  ) {
    throw new ApiError(502, 'invalid_chain_data', 'The provider returned invalid transaction history');
  }

  return data;
}

export function nextUtxoHistory(data: UtxoProviderTransaction[]) {
  const confirmed = data.filter((transaction) => transaction.status.confirmed);

  return confirmed.length >= ESPLORA_HISTORY_PAGE_SIZE ? confirmed.at(-1)!.txid : null;
}

export async function loadUtxoHistory(
  cursor: UtxoHistoryCursor,
  xpub: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<WalletHistoryPage> {
  if (
    cursor.kind !== 'utxo' ||
    !Array.isArray(cursor.counts) ||
    cursor.counts.length !== 2 ||
    cursor.counts.some((count) => !Number.isSafeInteger(count) || count < 0 || count >= 2 ** 31) ||
    !Array.isArray(cursor.after) ||
    cursor.after.some(
      (item) =>
        !item ||
        (item.branch !== 0 && item.branch !== 1) ||
        !Number.isSafeInteger(item.index) ||
        item.index < 0 ||
        item.index >= cursor.counts[item.branch] ||
        !Number.isSafeInteger(item.remaining) ||
        item.remaining < 0 ||
        (item.txid !== null && !/^[a-f0-9]{64}$/i.test(item.txid)),
    )
  ) {
    throw new ApiError(400, 'invalid_history_cursor', 'Refresh this wallet before loading more history');
  }

  const addresses = new Set<string>();

  for (const branch of [0, 1] as const) {
    for (let index = 0; index < cursor.counts[branch]; index++) {
      addresses.add(xpubToAddress(cursor.coin, xpub, index, branch));
    }
  }

  const pages = await Promise.all(
    cursor.after.slice(0, 6).map(async (item) => {
      const address = xpubToAddress(cursor.coin, xpub, item.index, item.branch);
      const path = item.txid ? `txs/chain/${item.txid}` : 'txs';
      const data = validateUtxoHistory(
        await chainJson(`${cursor.endpoint}/address/${address}/${path}`, {signal}, fetcher),
      );
      const confirmed = data.filter((transaction) => transaction.status.confirmed).length;

      if (
        data.some((transaction) => transaction.txid === item.txid) ||
        confirmed < Math.min(ESPLORA_HISTORY_PAGE_SIZE, item.remaining)
      ) {
        throw new ApiError(
          502,
          'history_not_advancing',
          'The provider could not continue this history page. Refresh or retry later',
        );
      }

      const after = nextUtxoHistory(data);

      return {data, after: after ? {...item, txid: after, remaining: Math.max(0, item.remaining - confirmed)} : null};
    }),
  );
  const next = [...pages.flatMap((page) => (page.after ? [page.after] : [])), ...cursor.after.slice(6)];

  return {
    history: aggregateWalletHistory(
      pages.flatMap((page) => page.data),
      addresses,
    ),
    historyCursor: next.length ? sealHistoryCursor({...cursor, after: next}) : null,
    historyError: cursor.mempoolLimited
      ? 'The provider limits unconfirmed history to 50 transactions per address.'
      : undefined,
  };
}

export async function initialEvmHistory(
  coin: 'eth' | 'usdt',
  address: string,
  endblock: number,
  fetcher: typeof fetch,
  signal?: AbortSignal,
) {
  return withChainEndpoint(
    'eth',
    async (endpoint, attempt) => {
      const indexed = await explorerHeight(endpoint, fetcher, attempt);

      return loadEvmHistory(
        {
          kind: 'evm',
          coin,
          key: historyKey(address.toLowerCase()),
          endpoint,
          endblock: Math.min(endblock, indexed),
          page: 1,
          previous: '',
        },
        address,
        fetcher,
        attempt,
        indexed,
      );
    },
    signal,
  );
}

async function explorerHeight(endpoint: string, fetcher: typeof fetch, signal?: AbortSignal) {
  const params = new URLSearchParams({
    module: 'block',
    action: 'getblocknobytime',
    timestamp: String(Math.floor(Date.now() / 1000)),
    closest: 'before',
  });
  const data = await chainJson(`${endpoint}?${params}`, {signal}, fetcher);

  if (data.status !== '1' || !/^\d+$/.test(data.result) || !Number.isSafeInteger(Number(data.result))) {
    throw new ApiError(502, 'invalid_chain_data', 'The explorer could not establish its indexed block height');
  }

  return Number(data.result);
}

export async function loadEvmHistory(
  cursor: EvmHistoryCursor,
  address: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
  indexedHeight?: number,
): Promise<WalletHistoryPage> {
  if (
    cursor.kind !== 'evm' ||
    !Number.isSafeInteger(cursor.endblock) ||
    cursor.endblock < 0 ||
    !Number.isSafeInteger(cursor.page) ||
    cursor.page < 1 ||
    typeof cursor.previous !== 'string'
  ) {
    throw new ApiError(400, 'invalid_history_cursor', 'Refresh this wallet before loading more history');
  }

  const indexed = indexedHeight ?? (await explorerHeight(cursor.endpoint, fetcher, signal));

  if (indexed < cursor.endblock) {
    throw new ApiError(503, 'history_indexing', 'The explorer has not indexed this history snapshot yet');
  }

  const params = new URLSearchParams({
    module: 'account',
    action: cursor.coin === 'eth' ? 'txlist' : 'tokentx',
    address,
    endblock: String(cursor.endblock),
    sort: 'desc',
    page: String(cursor.page),
    offset: String(WALLET_HISTORY_PAGE_SIZE),
  });

  if (cursor.coin === 'usdt') {
    params.set('contractaddress', USDT_CONTRACT);
  }

  const data = await chainJson(`${cursor.endpoint}?${params}`, {signal}, fetcher);

  if (!Array.isArray(data.result) || (data.status !== '1' && !(data.status === '0' && data.result.length === 0))) {
    throw new ApiError(502, 'invalid_chain_data', 'The explorer could not load this history page');
  }

  const rows = data.result as EvmProviderTransaction[];
  if (
    rows.length > WALLET_HISTORY_PAGE_SIZE ||
    rows.some(
      (row) =>
        !/^\d+$/.test(row.blockNumber) ||
        Number(row.blockNumber) > cursor.endblock ||
        (cursor.coin === 'usdt' && row.contractAddress?.toLowerCase() !== USDT_CONTRACT.toLowerCase()),
    )
  ) {
    throw new ApiError(502, 'invalid_chain_data', 'The explorer did not honor the history snapshot or asset filter');
  }

  const fingerprint = historyKey(
    JSON.stringify(
      rows.map((row) => [row.hash, row.from, row.to, row.value, row.timeStamp, row.blockNumber, row.logIndex]),
    ),
  );

  if (
    rows.length &&
    fingerprint === cursor.previous &&
    (cursor.coin === 'eth' || rows.every((row) => /^\d+$/.test(row.logIndex ?? '')))
  ) {
    throw new ApiError(502, 'history_not_advancing', 'The explorer repeated a history page. Refresh or retry later');
  }

  const groups = evmHistoryGroups(rows, address, cursor.carry);
  const more = rows.length === WALLET_HISTORY_PAGE_SIZE;
  const carry = more ? groups.pop() : undefined;

  return {
    history: groups.map((group) => evmHistoryEntry(group, cursor.coin === 'eth' ? 18 : 6)),
    historyCursor: more ? sealHistoryCursor({...cursor, page: cursor.page + 1, previous: fingerprint, carry}) : null,
  };
}
