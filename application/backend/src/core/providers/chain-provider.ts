import {USDT_CONTRACT} from '@core/constants';
import {
  withChainEndpoint,
  chainJson,
  chainRequest,
  ethereumRpc,
  requireEthereumMainnet,
} from '@core/providers/chain-requests';
import {initialEvmHistory, openHistoryCursor, loadUtxoHistory, loadEvmHistory} from '@core/wallet/wallet-history';
import {Transaction} from '@scure/btc-signer';
import {getUtxoData, getXmrNode, mapChainRequests} from '@utils/crypto-nodes';
import {ApiError} from '@core/security';
import type {
  CryptoCurrencies,
  WalletScanOptions,
  WalletOverviewOperation,
  EvmTransferRequest,
  WalletIssuedBounds,
} from '@type';

function validateEvmTransfer(input: EvmTransferRequest) {
  if (
    !input ||
    (input.coin !== 'eth' && input.coin !== 'usdt') ||
    typeof input.recipient !== 'string' ||
    !/^0x[a-f0-9]{40}$/i.test(input.recipient) ||
    !['low', 'medium', 'high'].includes(input.priority) ||
    (input.sweep !== undefined && typeof input.sweep !== 'boolean')
  ) {
    throw new ApiError(400, 'invalid_transaction', 'Choose a recipient, asset, and network priority');
  }

  if (input.sweep) {
    return 0n;
  }

  const decimals = input.coin === 'eth' ? 18 : 6;

  if (
    typeof input.amount !== 'string' ||
    input.amount.length > 80 ||
    !new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(input.amount)
  ) {
    throw new ApiError(400, 'invalid_amount', 'Use a positive amount within the asset precision');
  }

  const [whole, fraction = ''] = input.amount.split('.');
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0'));

  if (amount <= 0n || amount >= 2n ** 256n) {
    throw new ApiError(400, 'invalid_amount', 'Use a positive amount within the asset precision');
  }

  return amount;
}

function parseUtxoTransaction(hex: string) {
  try {
    if (typeof hex !== 'string' || hex.length > 1_000_000 || !/^(?:[a-f0-9]{2})+$/i.test(hex)) {
      throw new Error('Invalid signed bytes');
    }

    const transaction = Transaction.fromRaw(Uint8Array.from(Buffer.from(hex, 'hex')));

    if (
      !transaction.isFinal ||
      !transaction.inputsLength ||
      transaction.inputsLength > 500 ||
      !transaction.outputsLength
    ) {
      throw new Error('Invalid signed transaction');
    }

    const inputs = Array.from({length: transaction.inputsLength}, (_, index) => {
      const input = transaction.getInput(index);

      if (!input.txid || input.index === undefined) {
        throw new Error('Invalid transaction input');
      }

      return {txid: Buffer.from(input.txid).toString('hex'), vout: input.index};
    });

    return {id: transaction.id, inputs};
  } catch {
    throw new ApiError(400, 'invalid_transaction', 'Use one complete signed Bitcoin or Litecoin transaction');
  }
}

export function createChainProvider(fetcher: typeof fetch = fetch) {
  const overviews = new Map<string, WalletOverviewOperation>();
  async function request(url: string, options?: RequestInit) {
    const response = await chainRequest(url, options, fetcher);

    if (!response.ok) {
      throw new ApiError(503, 'chain_unavailable', 'The blockchain provider is unavailable');
    }

    return response;
  }

  function rpc(endpoint: string, method: string, params: unknown[], signal?: AbortSignal): Promise<any> {
    return ethereumRpc(endpoint, method, params, signal, fetcher);
  }

  async function readUtxoTransaction(endpoint: string, txid: string, signal: AbortSignal) {
    if (!/^[a-f0-9]{64}$/i.test(txid || '')) {
      throw new ApiError(502, 'invalid_chain_data', 'The provider returned an invalid transaction reference');
    }

    const response = await chainRequest(`${endpoint}/tx/${txid}`, {signal}, fetcher);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new ApiError(503, 'chain_unavailable', 'Transaction status is unavailable');
    }

    const data = await response.json();

    if (
      data.txid !== txid ||
      !Array.isArray(data.vin) ||
      typeof data.status?.confirmed !== 'boolean' ||
      (data.status.confirmed &&
        (!Number.isSafeInteger(data.status.block_height) ||
          data.status.block_height <= 0 ||
          !/^[a-f0-9]{64}$/i.test(data.status.block_hash || '')))
    ) {
      throw new ApiError(502, 'invalid_chain_data', 'The provider returned invalid transaction status');
    }

    return data;
  }

  async function pendingEvm(endpoint: string, address: string, signal?: AbortSignal) {
    if (typeof address !== 'string' || !/^0x[a-f0-9]{40}$/i.test(address)) {
      throw new ApiError(400, 'invalid_address', 'Use one valid Ethereum address');
    }

    const values = await Promise.all([
      rpc(endpoint, 'eth_getTransactionCount', [address, 'pending'], signal),
      rpc(endpoint, 'eth_getBalance', [address, 'pending'], signal),
      rpc(
        endpoint,
        'eth_call',
        [{to: USDT_CONTRACT, data: `0x70a08231${address.slice(2).padStart(64, '0')}`}, 'pending'],
        signal,
      ),
    ]);

    if (values.some((value) => typeof value !== 'string' || !/^0x[a-f0-9]+$/i.test(value))) {
      throw new ApiError(502, 'invalid_chain_data', 'Invalid pending Ethereum state');
    }

    const [nonce, ethBalance, usdtBalance] = values.map((value) => BigInt(value));

    if (nonce > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new ApiError(502, 'invalid_chain_data', 'Invalid pending Ethereum nonce');
    }

    return {nonce: Number(nonce), ethBalanceAtoms: ethBalance.toString(), usdtBalanceAtoms: usdtBalance.toString()};
  }

  async function estimateEvmTransfer(
    endpoint: string,
    address: string,
    input: EvmTransferRequest,
    amount: bigint,
    ethBalance: bigint,
    maxFeePerGas: bigint,
    signal?: AbortSignal,
  ) {
    const transaction = {
      from: address,
      to: input.coin === 'eth' ? input.recipient : USDT_CONTRACT,
      value: '0x0',
      ...(input.coin === 'usdt'
        ? {data: `0xa9059cbb${input.recipient.slice(2).padStart(64, '0')}${amount.toString(16).padStart(64, '0')}`}
        : {}),
    };

    if (!input.sweep && input.coin === 'eth') {
      transaction.value = `0x${amount.toString(16)}`;
    }

    const estimate = await rpc(endpoint, 'eth_estimateGas', [transaction, 'pending'], signal);

    if (
      typeof estimate !== 'string' ||
      !/^0x[a-f0-9]+$/i.test(estimate) ||
      BigInt(estimate) <= 0n ||
      BigInt(estimate) > 30_000_000n
    ) {
      throw new ApiError(502, 'invalid_chain_data', 'The provider returned an invalid gas estimate');
    }

    const gasLimit = (BigInt(estimate) * 120n + 99n) / 100n;
    const maximumFee = gasLimit * maxFeePerGas;

    if (input.sweep && input.coin === 'eth') {
      amount -= maximumFee;
    }

    if (amount <= 0n || ethBalance < maximumFee + (input.coin === 'eth' ? amount : 0n)) {
      throw new ApiError(
        400,
        'insufficient_funds',
        'The source balance does not cover this transfer and maximum network fee',
      );
    }

    if (input.sweep && input.coin === 'eth') {
      const verified = await rpc(
        endpoint,
        'eth_estimateGas',
        [{...transaction, value: `0x${amount.toString(16)}`}, 'pending'],
        signal,
      );

      if (typeof verified !== 'string' || !/^0x[a-f0-9]+$/i.test(verified) || BigInt(verified) > gasLimit) {
        throw new ApiError(
          400,
          'unstable_gas_estimate',
          'Gas changed while preparing this sweep. Use a smaller transfer amount',
        );
      }
    }

    return {amountAtoms: amount.toString(), gasLimit: gasLimit.toString()};
  }

  const provider = {
    async utxo(coin: 'btc' | 'ltc', key: string, options?: WalletScanOptions) {
      const wallet = await withChainEndpoint(
        coin,
        (endpoint, signal) => getUtxoData(coin, key, endpoint, fetcher, {...options, signal}),
        options?.signal,
      );

      if (wallet.historyError && wallet.historyCursor) {
        try {
          const page = await provider.history(coin, key, wallet.historyCursor, options?.signal);
          const history = new Map([...wallet.history, ...page.history].map((entry) => [entry.txid, entry]));

          return {
            ...wallet,
            ...page,
            history: [...history.values()].sort(
              (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
            ),
          };
        } catch {
          options?.signal?.throwIfAborted();
        }
      }

      return wallet;
    },
    async evmOverview(address: string, signal?: AbortSignal) {
      const state = await withChainEndpoint(
        'ethRpc',
        async (endpoint, attempt) => {
          await requireEthereumMainnet(endpoint, attempt, fetcher);

          const [pending, height] = await Promise.all([
            pendingEvm(endpoint, address, attempt),
            rpc(endpoint, 'eth_blockNumber', [], attempt),
          ]);

          if (
            typeof height !== 'string' ||
            !/^0x[a-f0-9]+$/i.test(height) ||
            BigInt(height) > BigInt(Number.MAX_SAFE_INTEGER)
          ) {
            throw new ApiError(502, 'invalid_chain_data', 'The provider returned an invalid Ethereum height');
          }

          return {...pending, height: Number(BigInt(height))};
        },
        signal,
      );

      return Promise.allSettled(
        (['eth', 'usdt'] as const).map(async (coin) => {
          const balanceAtoms = coin === 'eth' ? state.ethBalanceAtoms : state.usdtBalanceAtoms;
          let history: import('@type').WalletHistoryPage;

          try {
            history = await initialEvmHistory(coin, address, state.height, fetcher, signal);
          } catch {
            history = {
              history: [],
              historyCursor: null,
              historyError: 'Transaction history is unavailable. Refresh to retry.',
            };
          }

          return {
            status: 'Synced',
            balance: Number(balanceAtoms) / (coin === 'eth' ? 1e18 : 1e6),
            balanceAtoms,
            nonce: state.nonce,
            ...history,
          };
        }),
      );
    },
    async history(coin: string, key: string, value: unknown, signal?: AbortSignal) {
      const cursor = openHistoryCursor(value, coin, key);
      const controller = new AbortController();
      const attempt = AbortSignal.any([controller.signal, AbortSignal.timeout(20_000), ...(signal ? [signal] : [])]);

      try {
        const network = cursor.kind === 'utxo' ? cursor.coin : 'eth';

        return await withChainEndpoint(
          network,
          async (endpoint, signal) => {
            if (cursor.kind === 'utxo') {
              return loadUtxoHistory({...cursor, endpoint}, key, fetcher, signal);
            }

            const reset = endpoint !== cursor.endpoint;
            const page = await loadEvmHistory(
              reset ? {...cursor, endpoint, page: 1, previous: '', carry: undefined} : cursor,
              key,
              fetcher,
              signal,
            );

            return {...page, reset};
          },
          attempt,
          cursor.endpoint,
        );
      } finally {
        controller.abort();
      }
    },
    async overview(
      scope: string,
      keys: {btc: string; ltc: string; evm: string},
      issued: Record<'btc' | 'ltc', WalletIssuedBounds>,
      signal?: AbortSignal,
    ) {
      signal?.throwIfAborted();
      const key = JSON.stringify([scope, keys.btc, keys.ltc, keys.evm, issued]);
      let operation = overviews.get(key);

      if (!operation) {
        const controller = new AbortController();
        const result = Promise.all([
          Promise.allSettled([
            provider.utxo('btc', keys.btc, {signal: controller.signal, issued: issued.btc}),
            provider.utxo('ltc', keys.ltc, {signal: controller.signal, issued: issued.ltc}),
          ]),
          provider.evmOverview(keys.evm, controller.signal).catch((reason) => [
            {status: 'rejected' as const, reason},
            {status: 'rejected' as const, reason},
          ]),
        ]).then(([utxo, evm]) => [...utxo, ...evm]);

        operation = {controller, result, subscribers: 0};
        overviews.set(key, operation);
        void result
          .finally(() => {
            if (overviews.get(key) === operation) {
              overviews.delete(key);
            }
          })
          .catch(() => {});
      }

      const current = operation;
      current.subscribers++;
      let abortSubscriber: (() => void) | undefined;
      const cancelled = new Promise<never>((_, reject) => {
        abortSubscriber = () => reject(signal?.reason ?? new DOMException('Wallet request cancelled', 'AbortError'));
        signal?.addEventListener('abort', abortSubscriber, {once: true});
      });

      try {
        return await Promise.race([current.result, cancelled]);
      } finally {
        if (abortSubscriber) {
          signal?.removeEventListener('abort', abortSubscriber);
        }

        current.subscribers--;

        if (current.subscribers === 0) {
          current.controller.abort();

          if (overviews.get(key) === current) {
            overviews.delete(key);
          }
        }
      }
    },
    node: () => getXmrNode(fetcher),
    async prepareEvm(address: string, input: EvmTransferRequest, signal?: AbortSignal) {
      const requestedAmount = validateEvmTransfer(input);

      return withChainEndpoint(
        'ethRpc',
        async (endpoint, signal) => {
          await requireEthereumMainnet(endpoint, signal, fetcher);

          const [pending, block, priorityResult] = await Promise.all([
            pendingEvm(endpoint, address, signal),
            rpc(endpoint, 'eth_getBlockByNumber', ['latest', false], signal),
            rpc(endpoint, 'eth_maxPriorityFeePerGas', [], signal),
          ]);

          if (!/^0x[a-f0-9]+$/i.test(block?.baseFeePerGas || '') || !/^0x[a-f0-9]+$/i.test(priorityResult || '')) {
            throw new ApiError(502, 'invalid_chain_data', 'Current Ethereum fee data is unavailable');
          }

          const multiplier = {low: 100n, medium: 150n, high: 200n}[input.priority];
          const suggestedPriority = BigInt(priorityResult);
          const maxPriorityFeePerGas = ((suggestedPriority > 0n ? suggestedPriority : 1n) * multiplier + 99n) / 100n;
          const maxFeePerGas = BigInt(block.baseFeePerGas) * 2n + maxPriorityFeePerGas;
          const balance = BigInt(input.coin === 'eth' ? pending.ethBalanceAtoms : pending.usdtBalanceAtoms);
          const amount = input.sweep ? balance : requestedAmount;
          if (amount > balance) {
            throw new ApiError(400, 'insufficient_funds', 'The source balance does not cover this amount');
          }

          const prepared = await estimateEvmTransfer(
            endpoint,
            address,
            input,
            amount,
            BigInt(pending.ethBalanceAtoms),
            maxFeePerGas,
            signal,
          );

          return {
            ...pending,
            ...prepared,
            maxFeePerGas: maxFeePerGas.toString(),
            maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
          };
        },
        signal,
      );
    },
    async reconcileEvm(address: string, txid: string, nonce: number) {
      if (
        typeof address !== 'string' ||
        !/^0x[a-f0-9]{40}$/i.test(address) ||
        typeof txid !== 'string' ||
        !/^0x[a-f0-9]{64}$/i.test(txid) ||
        !Number.isSafeInteger(nonce) ||
        nonce < 0
      ) {
        throw new ApiError(400, 'invalid_transaction', 'A valid sender and broadcast reference are required');
      }

      return withChainEndpoint('ethRpc', async (endpoint, signal) => {
        await requireEthereumMainnet(endpoint, signal, fetcher);

        const [transaction, pending] = await Promise.all([
          rpc(endpoint, 'eth_getTransactionByHash', [txid], signal),
          rpc(endpoint, 'eth_getTransactionCount', [address, 'pending'], signal),
        ]);

        if (typeof pending !== 'string' || !/^0x[a-f0-9]+$/i.test(pending)) {
          throw new ApiError(502, 'invalid_chain_data', 'Broadcast reconciliation is unavailable');
        }

        if (
          transaction &&
          (transaction.hash?.toLowerCase() !== txid.toLowerCase() ||
            transaction.from?.toLowerCase() !== address.toLowerCase() ||
            !/^0x[a-f0-9]+$/i.test(transaction.nonce || '') ||
            BigInt(transaction.nonce) !== BigInt(nonce))
        ) {
          throw new ApiError(502, 'invalid_chain_data', 'The provider returned a different transaction');
        }

        return {status: BigInt(pending) > BigInt(nonce) ? 'consumed' : transaction ? 'seen' : 'unknown'};
      });
    },
    async reconcileUtxo(coin: 'btc' | 'ltc', hex: string, signal?: AbortSignal) {
      const signed = parseUtxoTransaction(hex);
      const deadline = AbortSignal.any([AbortSignal.timeout(20_000), ...(signal ? [signal] : [])]);

      return withChainEndpoint(
        coin,
        async (endpoint, signal) => {
          const current = await readUtxoTransaction(endpoint, signed.id, signal);

          if (current) {
            if (
              current.vin.length !== signed.inputs.length ||
              current.vin.some(
                (input: {txid: string; vout: number}) =>
                  !signed.inputs.some((expected) => expected.txid === input.txid && expected.vout === input.vout),
              )
            ) {
              throw new ApiError(502, 'invalid_chain_data', 'The provider returned a different transaction');
            }

            return {status: current.status.confirmed ? 'confirmed' : 'seen', txid: signed.id};
          }

          const conflicts = await mapChainRequests(
            signed.inputs,
            async (input) => {
              const spent = await chainJson(`${endpoint}/tx/${input.txid}/outspend/${input.vout}`, {signal}, fetcher);

              if (typeof spent.spent !== 'boolean') {
                throw new ApiError(502, 'invalid_chain_data', 'The provider returned invalid input status');
              }

              if (!spent.spent || spent.txid === signed.id || !spent.status?.confirmed) {
                return false;
              }

              const spender = await readUtxoTransaction(endpoint, spent.txid, signal);

              return (
                !!spender?.status.confirmed &&
                spender.vin.some(
                  (entry: {txid: string; vout: number}) => entry.txid === input.txid && entry.vout === input.vout,
                )
              );
            },
            signal,
          );

          if (conflicts.some(Boolean)) {
            return {status: 'conflicted', txid: signed.id};
          }

          return {status: 'unknown', txid: signed.id};
        },
        deadline,
      );
    },
    async broadcast(coin: CryptoCurrencies, hex: string, signal?: AbortSignal) {
      if (coin === 'btc' || coin === 'ltc') {
        const signed = parseUtxoTransaction(hex);

        try {
          return await withChainEndpoint(
            coin,
            async (endpoint, signal) => {
              const response = await chainRequest(`${endpoint}/tx`, {method: 'POST', body: hex, signal}, fetcher);
              const txid = (await response.text()).trim();

              if (!response.ok || txid !== signed.id) {
                throw new ApiError(
                  502,
                  'broadcast_uncertain',
                  'Broadcast acceptance is uncertain. Look up or retry the saved transaction',
                );
              }

              return {txid};
            },
            signal,
          );
        } catch {
          throw new ApiError(
            502,
            'broadcast_uncertain',
            'Broadcast acceptance is uncertain. Look up or retry the same signed transaction',
          );
        }
      }

      if (coin !== 'eth' && coin !== 'usdt') {
        throw new ApiError(400, 'invalid_coin', 'Monero transactions are broadcast by the browser wallet');
      }

      return withChainEndpoint(
        'ethRpc',
        async (endpoint, signal) => {
          await requireEthereumMainnet(endpoint, signal, fetcher);

          const data = await chainJson(
            endpoint,
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({id: 1, jsonrpc: '2.0', method: 'eth_sendRawTransaction', params: [hex]}),
              signal,
            },
            fetcher,
          );

          if (data.error || !/^0x[a-f0-9]{64}$/i.test(data.result || '')) {
            throw new ApiError(
              502,
              'broadcast_uncertain',
              'Broadcast acceptance is uncertain. Look up or retry the same signed transaction',
            );
          }

          return {txid: data.result};
        },
        signal,
      );
    },
    async sweep(coin: CryptoCurrencies, addresses: string[]) {
      if (coin === 'btc' || coin === 'ltc') {
        return withChainEndpoint(coin, async (base, signal) => {
          if (!addresses.every((address) => /^[a-zA-Z0-9]{26,90}$/.test(address))) {
            throw new ApiError(400, 'invalid_address', 'Invalid sweep address');
          }

          const results = await mapChainRequests(addresses, async (address) => {
            const response = await request(`${base}/address/${encodeURIComponent(address)}/utxo`, {signal});

            const values = await response.json();

            if (
              !Array.isArray(values) ||
              values.some(
                (item) =>
                  !/^[a-f0-9]{64}$/i.test(item.txid || '') ||
                  !Number.isSafeInteger(item.vout) ||
                  item.vout < 0 ||
                  !Number.isSafeInteger(item.value) ||
                  item.value < 0,
              )
            ) {
              throw new ApiError(502, 'invalid_chain_data', 'The provider returned invalid unspent outputs');
            }

            return values.map((item) => ({
              txid: item.txid,
              vout: item.vout,
              value: item.value,
              address,
              pathIndex: 0,
              branch: 0 as const,
            }));
          });

          const utxos = results.flat();

          if (utxos.length > 500) {
            throw new ApiError(400, 'sweep_limit', 'Sweep supports up to 500 unspent outputs');
          }

          const transactions = new Map<string, string>();

          const legacy = utxos.filter((output) => output.address.startsWith(coin === 'btc' ? '1' : 'L'));

          await mapChainRequests([...new Set(legacy.map((output) => output.txid))], async (txid) => {
            const response = await request(`${base}/tx/${txid}/hex`, {signal});

            const rawTx = (await response.text()).trim();

            if (!/^[a-f0-9]+$/i.test(rawTx) || rawTx.length % 2) {
              throw new ApiError(502, 'invalid_chain_data', 'Previous transaction data is unavailable');
            }

            transactions.set(txid, rawTx);
          });

          const balance = utxos.reduce((total, output) => total + output.value, 0);

          if (!Number.isSafeInteger(balance)) {
            throw new ApiError(502, 'invalid_chain_data', 'Sweep balance exceeds supported precision');
          }

          return {utxos: utxos.map((output) => ({...output, rawTx: transactions.get(output.txid)})), balance};
        });
      }

      throw new ApiError(400, 'invalid_coin', 'Choose Bitcoin or Litecoin for private-key discovery');
    },
  };

  return provider;
}

export const chainProvider = createChainProvider();
