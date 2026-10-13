import {BTC_API, LTC_API, ETH_API, USDT_CONTRACT} from '@core/constants';
import {getUtxoData, getEvmData, getXmrNode, mapChainRequests} from '@utils/crypto-nodes';
import {ApiError} from '@core/security';
import type {CryptoCurrencies, WalletScanOptions, WalletOverviewOperation} from '@type';

export function createChainProvider(fetcher: typeof fetch = fetch) {
  const overviews = new Map<string, WalletOverviewOperation>();
  async function request(url: string, options?: RequestInit) {
    const response = await fetcher(url, {...options, signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(options?.signal ? [options.signal] : [])])});

    if (!response.ok) {
      throw new ApiError(503, 'chain_unavailable', 'The blockchain provider is unavailable');
    }

    return response;
  }

  const provider = {
    utxo: (coin: 'btc' | 'ltc', key: string, options?: WalletScanOptions) => getUtxoData(coin, key, fetcher, options),
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

      return Promise.allSettled([getEvmData('eth', address, sharedFetch, signal), getEvmData('usdt', address, sharedFetch, signal)]);
    },
    async overview(scope: string, keys: {btc: string; ltc: string; evm: string}, signal?: AbortSignal) {
      signal?.throwIfAborted();
      const key = JSON.stringify([scope, keys.btc, keys.ltc, keys.evm]);
      let operation = overviews.get(key);

      if (!operation) {
        const controller = new AbortController();
        const result = Promise.all([
          Promise.allSettled([provider.utxo('btc', keys.btc, {signal: controller.signal}), provider.utxo('ltc', keys.ltc, {signal: controller.signal})]),
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
    async prepareEvm(address: string, signal?: AbortSignal) {
      if (typeof address !== 'string' || !/^0x[a-f0-9]{40}$/i.test(address)) {
        throw new ApiError(400, 'invalid_address', 'Use one valid Ethereum address');
      }

      const methods = [
        {method: 'eth_getTransactionCount', params: [address, 'pending']},
        {method: 'eth_getBalance', params: [address, 'pending']},
        {method: 'eth_call', params: [{to: USDT_CONTRACT, data: `0x70a08231${address.slice(2).toLowerCase().padStart(64, '0')}`}, 'pending']},
        {method: 'eth_gasPrice', params: []},
      ];
      const values = await Promise.all(
        methods.map(async (method, index) => {
          const response = await request(`${ETH_API}/eth-rpc`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: index + 1, ...method}),
            signal,
          });
          const data = await response.json();

          if (data.error || !/^0x[a-f0-9]+$/i.test(data.result || '')) {
            throw new ApiError(503, 'chain_unavailable', 'Pending Ethereum state is unavailable');
          }

          return BigInt(data.result);
        }),
      );
      const [nonce, ethBalance, usdtBalance, gasPrice] = values;

      if (nonce > BigInt(Number.MAX_SAFE_INTEGER) || gasPrice <= 0n || gasPrice > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new ApiError(502, 'invalid_chain_data', 'Invalid pending transaction state');
      }

      return {
        nonce: Number(nonce),
        ethBalanceAtoms: ethBalance.toString(),
        usdtBalanceAtoms: usdtBalance.toString(),
        gasPrice: Number(gasPrice) / 1e9,
        gasPriceAtoms: gasPrice.toString(),
      };
    },
    async broadcast(coin: CryptoCurrencies, hex: string) {
      if (coin === 'btc' || coin === 'ltc') {
        const response = await request(`${coin === 'btc' ? BTC_API : LTC_API}/tx`, {method: 'POST', body: hex});

        const txid = (await response.text()).trim();

        if (!/^[a-f0-9]{64}$/i.test(txid)) {
          throw new ApiError(502, 'broadcast_failed', 'The provider did not confirm transaction acceptance');
        }

        return {txid};
      }

      if (coin !== 'eth' && coin !== 'usdt') {
        throw new ApiError(400, 'invalid_coin', 'Monero transactions are broadcast by the browser wallet');
      }

      const response = await request(`${ETH_API}/eth-rpc`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: 1, jsonrpc: '2.0', method: 'eth_sendRawTransaction', params: [hex]}),
      });

      const result = await response.json();

      if (result.error || !/^0x[a-f0-9]{64}$/i.test(result.result || '')) {
        throw new ApiError(502, 'broadcast_failed', 'The provider rejected the transaction');
      }

      return {txid: result.result};
    },
    async sweep(coin: CryptoCurrencies, addresses: string[]) {
      if (coin === 'btc' || coin === 'ltc') {
        const base = coin === 'btc' ? BTC_API : LTC_API;

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

        return {utxos: utxos.map((output) => ({...output, rawTx: transactions.get(output.txid)})), balance, nonce: 0};
      }

      if (coin !== 'eth' && coin !== 'usdt') {
        throw new ApiError(400, 'invalid_coin', 'Use the browser Monero wallet to sweep Monero');
      }

      if (addresses.length !== 1 || !/^0x[a-f0-9]{40}$/i.test(addresses[0])) {
        throw new ApiError(400, 'invalid_address', 'Use one valid Ethereum address');
      }

      const pending = await this.prepareEvm(addresses[0]);

      return {
        utxos: [],
        balance: coin === 'usdt' ? pending.usdtBalanceAtoms : pending.ethBalanceAtoms,
        gasBalance: pending.ethBalanceAtoms,
        nonce: pending.nonce,
        gasPrice: pending.gasPrice,
        gasPriceAtoms: pending.gasPriceAtoms,
      };
    },
  };

  return provider;
}

export const chainProvider = createChainProvider();
