import {chainEndpoints} from '@core/config';
import {ApiError, requireProvider} from '@core/security';
import {CHAIN_PROVIDER_COOLDOWN_MS, CHAIN_REQUEST_TIMEOUT_MS} from '@core/constants';
import type {ChainNetwork} from '@type';

const unavailableUntil = new Map<string, number>();

export async function withChainEndpoint<T>(
  network: ChainNetwork,
  operation: (endpoint: string, signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  preferred?: string,
) {
  requireProvider(chainEndpoints[network].length > 0, `${network.toUpperCase()} blockchain provider`);

  const endpoints = [...chainEndpoints[network]].sort(
    (left, right) =>
      Number((unavailableUntil.get(left) || 0) > Date.now()) -
        Number((unavailableUntil.get(right) || 0) > Date.now()) ||
      Number(right === preferred) - Number(left === preferred),
  );
  let failure: unknown;

  for (const endpoint of endpoints) {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const attempt = AbortSignal.any([controller.signal, ...(signal ? [signal] : [])]);

    try {
      const value = await operation(endpoint, attempt);
      unavailableUntil.delete(endpoint);

      return value;
    } catch (cause) {
      controller.abort();
      signal?.throwIfAborted();

      if (cause instanceof ApiError && cause.status < 500) {
        throw cause;
      }

      unavailableUntil.set(endpoint, Date.now() + CHAIN_PROVIDER_COOLDOWN_MS);
      failure = cause;
    }
  }

  if (failure instanceof ApiError) {
    throw failure;
  }

  throw new ApiError(503, 'chain_unavailable', 'The configured blockchain providers are unavailable. Retry shortly');
}

export async function chainRequest(url: string, options: RequestInit = {}, fetcher: typeof fetch = fetch) {
  return fetcher(url, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.any([
      AbortSignal.timeout(CHAIN_REQUEST_TIMEOUT_MS),
      ...(options.signal ? [options.signal] : []),
    ]),
  });
}

export async function chainJson(url: string, options: RequestInit = {}, fetcher: typeof fetch = fetch) {
  const response = await chainRequest(url, options, fetcher);

  if (!response.ok) {
    throw new ApiError(503, 'chain_unavailable', 'The blockchain provider is unavailable');
  }

  return response.json();
}

export async function ethereumRpc(
  endpoint: string,
  method: string,
  params: unknown[],
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<any> {
  const data = await chainJson(
    endpoint,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
      signal,
    },
    fetcher,
  );

  if (data.error || data.result === undefined) {
    throw new ApiError(503, 'chain_unavailable', 'The Ethereum provider could not complete this request');
  }

  return data.result;
}

export async function requireEthereumMainnet(endpoint: string, signal?: AbortSignal, fetcher: typeof fetch = fetch) {
  const chain = await ethereumRpc(endpoint, 'eth_chainId', [], signal, fetcher);

  if (typeof chain !== 'string' || !/^0x0*1$/i.test(chain)) {
    throw new ApiError(503, 'wrong_chain', 'The Ethereum provider is not connected to mainnet');
  }
}

export async function moneroNodeInfo(endpoint: string, signal?: AbortSignal, fetcher: typeof fetch = fetch) {
  const data = await chainJson(
    endpoint,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_info'}),
      signal,
    },
    fetcher,
  );
  const info = data.result;

  if (
    data.error ||
    info?.status !== 'OK' ||
    info.nettype !== 'mainnet' ||
    info.offline ||
    !Number.isSafeInteger(info.height) ||
    !Number.isSafeInteger(info.target_height) ||
    (info.target_height > 0 && info.target_height - info.height > 5)
  ) {
    throw new ApiError(503, 'chain_unavailable', 'The Monero node is unavailable or behind mainnet');
  }

  return info;
}
