import type {ApiResult} from '$type';

export async function request<T>(
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  let url = `/api${path}`;

  if (method === 'GET' && body) {
    url += `?${new URLSearchParams(
      Object.entries(body)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    )}`;
  }

  try {
    const response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error?.message || 'Request failed',
        code: data.error?.code || 'request_failed',
        status: response.status,
      };
    }

    return {ok: true, data};
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Request interrupted. Your changes have not been confirmed.'
          : 'The service could not be reached. Please try again.',
      code: 'network_error',
      status: null,
    };
  }
}
