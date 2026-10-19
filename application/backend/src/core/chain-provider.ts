import {USDT_CONTRACT} from '@core/constants';
import {chainEndpoints} from '@core/config';
import {getUtxoData, getEvmData, getXmrNode, mapChainRequests} from '@utils/crypto-nodes';
import {ApiError, requireProvider} from '@core/security';
import type {CryptoCurrencies, WalletScanOptions, WalletOverviewOperation, EvmTransferRequest} from '@type';

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

export function createChainProvider(fetcher: typeof fetch = fetch) {
  const overviews = new Map<string, WalletOverviewOperation>();
  async function request(url: string, options?: RequestInit) {
    const response = await fetcher(url, {
      ...options,
      signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(options?.signal ? [options.signal] : [])]),
    });

    if (!response.ok) {
      throw new ApiError(503, 'chain_unavailable', 'The blockchain provider is unavailable');
    }

    return response;
  }

  async function rpc(method: string, params: unknown[], signal?: AbortSignal): Promise<any> {
    requireProvider(!!chainEndpoints.eth, 'Ethereum provider');

    const response = await request(`${chainEndpoints.eth}/eth-rpc`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
      signal,
    });
    const data = await response.json();

    if (data.error || data.result === undefined) {
      throw new ApiError(503, 'chain_unavailable', 'Ethereum transaction preparation is unavailable');
    }

    return data.result;
  }

  async function pendingEvm(address: string, signal?: AbortSignal) {
    if (typeof address !== 'string' || !/^0x[a-f0-9]{40}$/i.test(address)) {
      throw new ApiError(400, 'invalid_address', 'Use one valid Ethereum address');
    }

    const values = await Promise.all([
      rpc('eth_getTransactionCount', [address, 'pending'], signal),
      rpc('eth_getBalance', [address, 'pending'], signal),
      rpc(
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

    const estimate = await rpc('eth_estimateGas', [transaction, 'pending'], signal);

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
      requireProvider(!!(coin === 'btc' ? chainEndpoints.btc : chainEndpoints.ltc), 'Blockchain provider');

      return getUtxoData(coin, key, fetcher, options);
    },
    evm: (coin: 'eth' | 'usdt', address: string) => getEvmData(coin, address, fetcher),
    async evmOverview(address: string, signal?: AbortSignal) {
      const requests = new Map<string, Promise<Response>>();
      const sharedFetch = ((input: RequestInfo | URL, options?: RequestInit) => {
        const key = String(input);
        let pending = requests.get(key);

        if (!pending) {
          pending = fetcher(input, options);
          requests.set(key, pending);
        }

        return pending.then((response) => response.clone());
      }) as typeof fetch;

      return Promise.allSettled([
        getEvmData('eth', address, sharedFetch, signal),
        getEvmData('usdt', address, sharedFetch, signal),
      ]);
    },
    async overview(scope: string, keys: {btc: string; ltc: string; evm: string}, signal?: AbortSignal) {
      signal?.throwIfAborted();
      const key = JSON.stringify([scope, keys.btc, keys.ltc, keys.evm]);
      let operation = overviews.get(key);

      if (!operation) {
        const controller = new AbortController();
        const result = Promise.all([
          Promise.allSettled([
            provider.utxo('btc', keys.btc, {signal: controller.signal}),
            provider.utxo('ltc', keys.ltc, {signal: controller.signal}),
          ]),
          provider.evmOverview(keys.evm, controller.signal),
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

      const [pending, block, priorityResult] = await Promise.all([
        pendingEvm(address, signal),
        rpc('eth_getBlockByNumber', ['latest', false], signal),
        rpc('eth_maxPriorityFeePerGas', [], signal),
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

      const [transaction, pending] = await Promise.all([
        rpc('eth_getTransactionByHash', [txid]),
        rpc('eth_getTransactionCount', [address, 'pending']),
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
    },
    async broadcast(coin: CryptoCurrencies, hex: string) {
      if (coin === 'btc' || coin === 'ltc') {
        requireProvider(!!(coin === 'btc' ? chainEndpoints.btc : chainEndpoints.ltc), 'Blockchain provider');

        const response = await request(`${coin === 'btc' ? chainEndpoints.btc : chainEndpoints.ltc}/tx`, {
          method: 'POST',
          body: hex,
        });

        const txid = (await response.text()).trim();

        if (!/^[a-f0-9]{64}$/i.test(txid)) {
          throw new ApiError(502, 'broadcast_failed', 'The provider did not confirm transaction acceptance');
        }

        return {txid};
      }

      if (coin !== 'eth' && coin !== 'usdt') {
        throw new ApiError(400, 'invalid_coin', 'Monero transactions are broadcast by the browser wallet');
      }

      requireProvider(!!chainEndpoints.eth, 'Ethereum provider');

      const response = await request(`${chainEndpoints.eth}/eth-rpc`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: 1, jsonrpc: '2.0', method: 'eth_sendRawTransaction', params: [hex]}),
      });

      const result = await response.json();

      if (result.error || !/^0x[a-f0-9]{64}$/i.test(result.result || '')) {
        const message = typeof result.error?.message === 'string' ? result.error.message : '';
        const rejected = /invalid (?:sender|signature|chain id)|intrinsic gas too low|invalid rlp/i.test(message);

        throw new ApiError(
          502,
          rejected ? 'broadcast_rejected' : 'broadcast_uncertain',
          rejected
            ? 'The signed transaction is invalid and was rejected. Prepare it again'
            : 'Broadcast acceptance is uncertain. Look up or retry the same signed transaction',
        );
      }

      return {txid: result.result};
    },
    async sweep(coin: CryptoCurrencies, addresses: string[]) {
      if (coin === 'btc' || coin === 'ltc') {
        const base = coin === 'btc' ? chainEndpoints.btc : chainEndpoints.ltc;
        requireProvider(!!base, 'Blockchain provider');

        if (!addresses.every((address) => /^[a-zA-Z0-9]{26,90}$/.test(address))) {
          throw new ApiError(400, 'invalid_address', 'Invalid sweep address');
        }

        const results = await mapChainRequests(addresses, async (address) => {
          const response = await request(`${base}/address/${encodeURIComponent(address)}/utxo`);

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

          return values.map((item) => ({txid: item.txid, vout: item.vout, value: item.value, address, pathIndex: 0}));
        });

        const utxos = results.flat();

        if (utxos.length > 500) {
          throw new ApiError(400, 'sweep_limit', 'Sweep supports up to 500 unspent outputs');
        }

        const transactions = new Map<string, string>();

        const legacy = utxos.filter((output) => output.address.startsWith(coin === 'btc' ? '1' : 'L'));

        await mapChainRequests([...new Set(legacy.map((output) => output.txid))], async (txid) => {
          const response = await request(`${base}/tx/${txid}/hex`);

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
      }

      throw new ApiError(400, 'invalid_coin', 'Choose Bitcoin or Litecoin for private-key discovery');
    },
  };

  return provider;
}

export const chainProvider = createChainProvider();
