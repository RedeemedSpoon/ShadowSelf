import {getRequestEvent} from '$app/server';
import {env} from '$env/dynamic/private';
import type {ApiResult} from '$type';

export async function backend<T = Record<string, unknown>>(
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
  token?: string,
): Promise<ApiResult<T>> {
  try {
    const clientAddress = getRequestEvent().getClientAddress();
    const response = await fetch(`${env.BACKEND_URL || 'http://localhost:3000'}/api${path}`, {
      method,
      headers: {'Content-Type': 'application/json', ...(token ? {authorization: `Bearer ${token}`} : {}), 'X-Forwarded-For': clientAddress},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok) {
      return {ok: false, error: data.error?.message || 'Request failed', code: data.error?.code || 'request_failed', status: response.status};
    }

    return {ok: true, data};
  } catch {
    return {ok: false, error: 'The service could not be reached. Please try again.', code: 'service_unavailable', status: 503};
  }
}

export async function fetchBackend(
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
  token?: string,
): Promise<Record<string, any> & {type: 'success' | 'alert'}> {
  const result = await backend<Record<string, any>>(path, method, body, token);

  return result.ok ? {...result.data, type: 'success' as const} : {message: result.error, code: result.code, status: result.status, type: 'alert' as const};
}
