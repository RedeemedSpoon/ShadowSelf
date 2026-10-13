import {BTC_API, LTC_API, ETH_API, USDT_CONTRACT} from '@core/constants';
import {getUtxoData, getEvmData, getXmrNode} from '@utils/crypto-nodes';
import {ApiError} from '@core/security';
import type {CryptoCurrencies} from '@type';

function createChainProvider(fetcher: typeof fetch = fetch) {
  async function request(url: string, options?: RequestInit) {
    const response = await fetcher(url, {...options, signal: AbortSignal.timeout(15_000)});

    if (!response.ok) {
      throw new ApiError(503, 'chain_unavailable', 'The blockchain provider is unavailable');
    }

    return response;
  }

  return {
    utxo: (coin: 'btc' | 'ltc', key: string) => getUtxoData(coin, key, fetcher),
    evm: (coin: 'eth' | 'usdt', address: string) => getEvmData(coin, address, fetcher),
    node: () => getXmrNode(fetcher),
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

        const results = await Promise.all(
          addresses.map(async (address) => {
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
          }),
        );

        const utxos = results.flat();

        if (utxos.length > 500) {
          throw new ApiError(400, 'sweep_limit', 'Sweep supports up to 500 unspent outputs');
        }

        const transactions = new Map<string, string>();

        for (const txid of new Set(utxos.map((output) => output.txid))) {
          const response = await request(`${base}/tx/${txid}/hex`);

          const rawTx = (await response.text()).trim();

          if (!/^[a-f0-9]+$/i.test(rawTx) || rawTx.length % 2) {
            throw new ApiError(502, 'invalid_chain_data', 'Previous transaction data is unavailable');
          }

          transactions.set(txid, rawTx);
        }

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

      const address = addresses[0];
      const balanceQuery = coin === 'usdt' ? `tokenbalance&contractaddress=${USDT_CONTRACT}` : 'balance';
      const responses = await Promise.all([
        request(`${ETH_API}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`),
        request(`${ETH_API}?module=account&action=${balanceQuery}&address=${address}`),
        request(`${ETH_API}?module=account&action=balance&address=${address}`),
      ]);

      const [nonceData, balanceData, gasData] = await Promise.all(responses.map((response) => response.json()));

      if (
        !/^0x[a-f0-9]+$/i.test(nonceData.result || '') ||
        balanceData.status !== '1' ||
        !/^\d+$/.test(balanceData.result || '') ||
        gasData.status !== '1' ||
        !/^\d+$/.test(gasData.result || '')
      ) {
        throw new ApiError(502, 'invalid_chain_data', 'The provider returned invalid balance or nonce');
      }

      const nonce = Number(BigInt(nonceData.result));

      if (!Number.isSafeInteger(nonce)) {
        throw new ApiError(502, 'invalid_chain_data', 'Invalid transaction nonce');
      }

      return {utxos: [], balance: balanceData.result as string, gasBalance: gasData.result as string, nonce};
    },
  };
}

export const chainProvider = createChainProvider();
