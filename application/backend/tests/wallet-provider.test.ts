import {describe, expect, test} from 'bun:test';
import {HDKey} from '@scure/bip32';

process.env.SECRET_SAUCE ||= 'synthetic-wallet-test-secret';
process.env.POSTGRES_DB ||= 'synthetic_wallet_tests';
process.env.APP_DB_PASSWORD ||= 'synthetic-password';

const {getUtxoData} = await import('../src/utils/crypto-nodes');
const {xpubToAddress} = await import('../src/utils/cryptography');
const {createChainProvider} = await import('../src/core/chain-provider');
const key = HDKey.fromMasterSeed(new Uint8Array(32).fill(7)).derive("m/84'/0'/0'").publicExtendedKey;
const addresses = Array.from({length: 120}, (_, index) => xpubToAddress('btc', key, index));
const txid = 'a'.repeat(64);

function utxoFetcher(active: Set<number>, transaction?: unknown) {
  return (async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname.split('/');
    const index = addresses.indexOf(path[3]);
    const used = active.has(index);

    if (path.at(-1) === 'utxo') {
      return Response.json(used ? [{txid, vout: index, value: 100_000}] : []);
    }

    if (path.at(-1) === 'txs') {
      return Response.json(transaction && used ? [transaction] : []);
    }

    return Response.json({
      chain_stats: {tx_count: used ? 1 : 0, funded_txo_sum: used ? 100_000 : 0, spent_txo_sum: 0},
      mempool_stats: {tx_count: 0, funded_txo_sum: 0, spent_txo_sum: 0},
    });
  }) as typeof fetch;
}

describe('wallet discovery and accounting', () => {
  test('aggregates one transaction across all wallet outputs', async () => {
    const transaction = {
      txid,
      vin: [{prevout: {scriptpubkey_address: 'external', value: 210_000}}],
      vout: [0, 1].map((index) => ({scriptpubkey_address: addresses[index], value: 100_000})),
      status: {block_time: 1},
    };
    const result = await getUtxoData('btc', key, utxoFetcher(new Set([0, 1]), transaction));

    expect(result.history).toHaveLength(1);
    expect(result.history[0].amount).toBe(0.002);
  });

  test('finds funds after five unused addresses', async () => {
    const result = await getUtxoData('btc', key, utxoFetcher(new Set([5])));

    expect(result.balance).toBe(0.001);
    expect(result.nextIndex).toBe(6);
  });

  test('never generates an address outside the normal scan bound', async () => {
    const result = await getUtxoData('btc', key, utxoFetcher(new Set(addresses.map((_, index) => index))));

    expect(result.status).toBe('Incomplete');
    expect(result.nextIndex).toBeNull();
  });

  test('classifies internal transfers using the wallet net including the fee', async () => {
    const transaction = {
      txid,
      vin: [{prevout: {scriptpubkey_address: addresses[0], value: 200_000}}],
      vout: [{scriptpubkey_address: addresses[1], value: 190_000}],
      status: {block_time: 1},
    };
    const result = await getUtxoData('btc', key, utxoFetcher(new Set([0, 1]), transaction));

    expect(result.history).toHaveLength(1);
    expect(result.history[0]).toMatchObject({type: 'sent', amount: 0.0001, counterparty: 'Internal transfer'});
  });
});

test('preparation requests pending nonce and spendable state every time', async () => {
  let nonce = 2;
  const tags: string[] = [];
  const provider = createChainProvider((async (_input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body));
    tags.push(request.params.at(-1));
    const result = request.method === 'eth_getTransactionCount' ? `0x${nonce.toString(16)}` : '0x1234';

    return Response.json({jsonrpc: '2.0', id: request.id, result});
  }) as typeof fetch);

  expect((await provider.prepareEvm('0x' + '1'.repeat(40))).nonce).toBe(2);
  nonce = 3;
  expect((await provider.prepareEvm('0x' + '1'.repeat(40))).nonce).toBe(3);
  expect(tags.filter((tag) => tag === 'pending')).toHaveLength(6);
});

test.each([30, 125])('extended recovery finds activity at index %i without enabling unreachable new addresses', async (index) => {
  const recoveredAddress = xpubToAddress('btc', key, index);
  const fetcher = (async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname.split('/');
    const used = path[3] === recoveredAddress;

    if (path.at(-1) === 'utxo') {
      return Response.json(used ? [{txid, vout: 0, value: 100_000}] : []);
    }

    if (path.at(-1) === 'txs') {
      return Response.json([]);
    }

    return Response.json({
      chain_stats: {tx_count: used ? 1 : 0, funded_txo_sum: used ? 100_000 : 0, spent_txo_sum: 0},
      mempool_stats: {tx_count: 0, funded_txo_sum: 0, spent_txo_sum: 0},
    });
  }) as typeof fetch;
  const result = await getUtxoData('btc', key, fetcher, {recovery: true});

  expect(result.balance).toBe(0.001);
  expect(result.scanned).toBe(1200);
  expect(result.status).toBe('Incomplete');
  expect(result.nextIndex).toBeNull();
  expect(result.utxos[0].pathIndex).toBe(index);
});

test('rejects malformed UTXO amounts instead of displaying a usable wallet', async () => {
  const valid = utxoFetcher(new Set([0]));
  const fetcher = (async (input: RequestInfo | URL, options?: RequestInit) => {
    if (String(input).endsWith('/utxo')) {
      return Response.json([{txid, vout: 0, value: -1}]);
    }

    return valid(input, options);
  }) as typeof fetch;

  await expect(getUtxoData('btc', key, fetcher)).rejects.toThrow('wallet data is unavailable');
});
