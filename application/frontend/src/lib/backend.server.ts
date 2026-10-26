import {log, reportFailure} from '$logging';
import {env} from '$env/dynamic/private';
import type {ApiResult} from '$type';

export async function backend<T = Record<string, unknown>>(
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
  token?: string,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${env.BACKEND_URL || 'http://localhost:3000'}/api${path}`, {
      method,
      headers: {'Content-Type': 'application/json', ...(token ? {authorization: `Bearer ${token}`} : {})},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status >= 500 && !['provider_unavailable', 'billing_disabled'].includes(data.error?.code)) {
        log(
          'error',
          `Frontend API ${method} ${path.split('?')[0]}: HTTP ${response.status}; ${data.error?.message || 'Request failed'}`,
        );
      }

      return {
        ok: false,
        error: data.error?.message || 'Request failed',
        code: data.error?.code || 'request_failed',
        status: response.status,
      };
    }

    return {ok: true, data};
  } catch (failure) {
    reportFailure(`Frontend API ${method} ${path.split('?')[0]}`, failure);

    return {
      ok: false,
      error: 'The service could not be reached. Please try again.',
      code: 'service_unavailable',
      status: 503,
    };
  }
}

export async function fetchBackend(
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
  token?: string,
): Promise<Record<string, any> & {type: 'success' | 'alert'}> {
  const result = await backend<Record<string, any>>(path, method, body, token);

  return result.ok
    ? {...result.data, type: 'success' as const}
    : {message: result.error, code: result.code, status: result.status, type: 'alert' as const};
}
