import {describe, expect, test} from 'bun:test';
import {HDKey} from '@scure/bip32';
import {createChainProvider} from '../src/core/chain-provider';
import {aggregateEvmHistory} from '../src/utils/crypto-nodes';

const key = HDKey.fromMasterSeed(new Uint8Array(32).fill(11)).derive("m/84'/0'/0'").publicExtendedKey;
const address = '0x' + '1'.repeat(40);
const keys = {btc: key, ltc: key, evm: address};

function fixtureProvider(fail: (url: URL) => boolean = () => false) {
  const calls: string[] = [];
  const active = new Map<string, number>();
  const peak = new Map<string, number>();
  let aborted = 0;
  const fetcher = (async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(url.href);
    active.set(url.host, (active.get(url.host) ?? 0) + 1);
    peak.set(url.host, Math.max(peak.get(url.host) ?? 0, active.get(url.host)!));

    try {
      await new Promise<void>((resolve, reject) => {
        const signal = options?.signal;
        const cancel = () => {
          clearTimeout(timer);
          aborted++;
          reject(signal?.reason);
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', cancel);
          resolve();
        }, 2);
        signal?.addEventListener('abort', cancel, {once: true});
      });

      if (fail(url)) {
        return new Response('', {status: 503});
      }

      if (url.pathname.includes('/address/')) {
        return Response.json({
          chain_stats: {tx_count: 0, funded_txo_sum: 0, spent_txo_sum: 0},
          mempool_stats: {tx_count: 0, funded_txo_sum: 0, spent_txo_sum: 0},
        });
      }

      const action = url.searchParams.get('action');

      if (action === 'eth_getTransactionCount') {
        return Response.json({result: '0x7'});
      }

      if (action === 'txlist' || action === 'tokentx') {
        return Response.json({status: '0', result: []});
      }

      return Response.json({status: '1', result: '1000000'});
    } finally {
      active.set(url.host, active.get(url.host)! - 1);
    }
  }) as typeof fetch;

  return {provider: createChainProvider(fetcher), calls, peak, aborted: () => aborted};
}

describe('wallet overview request isolation', () => {
  test('coalesces concurrent authorized scopes, shares nonce reads, and bounds provider concurrency', async () => {
    const {provider, calls, peak} = fixtureProvider();
    const [first, second] = await Promise.all([provider.overview('owner-a:identity-a', keys), provider.overview('owner-a:identity-a', keys)]);

    expect(first).toEqual(second);
    expect(calls.filter((url) => url.includes('eth_getTransactionCount'))).toHaveLength(1);
    expect(calls.filter((url) => url.includes('mempool.space'))).toHaveLength(24);
    expect(peak.get('mempool.space')).toBe(6);
    const initialCalls = calls.length;
    await provider.overview('owner-a:identity-a', keys);
    expect(calls).toHaveLength(initialCalls * 2);
  });

  test('does not share wallet work across account authorization boundaries', async () => {
    const {provider, calls} = fixtureProvider();
    await Promise.all([provider.overview('owner-a:identity-a', keys), provider.overview('owner-b:identity-a', keys)]);

    expect(calls.filter((url) => url.includes('eth_getTransactionCount'))).toHaveLength(2);
    expect(calls.filter((url) => url.includes('mempool.space'))).toHaveLength(48);
  });

  test('one cancelled subscriber leaves the other subscriber running', async () => {
    const fixture = fixtureProvider();
    const controller = new AbortController();
    const cancelled = fixture.provider.overview('owner-a:identity-a', keys, controller.signal);
    const remaining = fixture.provider.overview('owner-a:identity-a', keys);
    const rejection = cancelled.catch((cause: unknown) => cause);
    controller.abort(new Error('cancelled subscriber'));
    expect(await rejection).toMatchObject({message: 'cancelled subscriber'});

    expect((await remaining).every((outcome) => outcome.status === 'fulfilled')).toBe(true);
    expect(fixture.aborted()).toBe(0);
  });

  test('cancels provider work when every subscriber disconnects', async () => {
    const fixture = fixtureProvider();
    const controller = new AbortController();
    const result = fixture.provider.overview('owner-a:identity-a', keys, controller.signal);
    const rejection = result.catch((cause: unknown) => cause);
    controller.abort(new Error('all cancelled'));
    expect(await rejection).toMatchObject({message: 'all cancelled'});
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fixture.aborted()).toBeGreaterThan(0);
  });

  test('reports one failed coin without hiding successful balances', async () => {
    const {provider} = fixtureProvider((url) => url.host === 'mempool.space' || url.searchParams.get('action') === 'balance');
    const outcomes = await provider.overview('owner-a:identity-a', keys);

    expect(outcomes.map((outcome) => outcome.status)).toEqual(['rejected', 'fulfilled', 'rejected', 'fulfilled']);
  });
});

test('aggregates multiple USDT events by transaction and excludes failed transfers', () => {
  const transaction = {hash: '0x' + 'a'.repeat(64), from: '0x' + '2'.repeat(40), to: address, value: '1000000', timeStamp: '2'};
  const history = aggregateEvmHistory(
    [transaction, {...transaction, value: '2000000'}, {...transaction, hash: '0x' + 'b'.repeat(64), isError: '1'}],
    address,
    6,
  );

  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({amount: 3, type: 'received'});
});

test('sweep fetches previous transactions only for legacy inputs', async () => {
  const addresses = ['bc1' + 'q'.repeat(39), '3' + 'a'.repeat(33), '1' + 'b'.repeat(33)];
  const transactionIDs = ['a', 'b', 'c'].map((character) => character.repeat(64));
  const historyReads: string[] = [];
  const provider = createChainProvider((async (input: RequestInfo | URL) => {
    const url = new URL(String(input));

    if (url.pathname.endsWith('/hex')) {
      historyReads.push(url.pathname.split('/')[3]);
      return new Response('00');
    }

    const index = addresses.indexOf(url.pathname.split('/')[3]);

    return Response.json([{txid: transactionIDs[index], vout: 0, value: 1000}]);
  }) as typeof fetch);
  const result = await provider.sweep('btc', addresses);

  expect(historyReads).toEqual([transactionIDs[2]]);
  expect(result.utxos[0].rawTx).toBeUndefined();
  expect(result.utxos[2].rawTx).toBe('00');
});
