import {PUBLIC_NODE_ENV} from '$env/static/public';
import type {APIResponse, ApiResult} from '$type';
import {identity} from '$store';
import {get} from 'svelte/store';

export async function fetchAPI<Type = APIResponse>(url: string, method = 'GET', body?: Record<string, unknown>): Promise<ApiResult<Type>> {
  const currentIdentity = get(identity);
  if (body && method !== 'GET' && url.startsWith('account/')) body = {...body, vaultRevision: currentIdentity.vaultRevision};

  let fullUrl = `/api/${url}/${currentIdentity.id}`;
  if (method === 'GET' && body) {
    const params = new URLSearchParams(Object.entries(body).map(([key, value]) => [key, String(value)]));
    fullUrl += `?${params}`;
  }

  let status: number | null = null;

  try {
    const response = await fetch(fullUrl, {
      method,
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
    });
    status = response.status;

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      const error = contentType.includes('text/plain') ? await response.text() : 'Unexpected response from server';
      return {ok: false, error: error || 'Request failed', status};
    }

    const data = await response.json();
    if (!response.ok) {
      const error = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : 'Request failed';
      return {ok: false, error, status};
    }

    if (Number.isSafeInteger(data?.vaultRevision)) {
      identity.update((value) => (value.id === currentIdentity.id ? {...value, vaultRevision: data.vaultRevision} : value));
    }

    return {ok: true, data};
  } catch {
    return {ok: false, error: 'An error occurred. Please try again later', status};
  }
}

export async function fetchBackend(url: string, method = 'GET', body?: Record<string, unknown>, authToken?: string) {
  const host = PUBLIC_NODE_ENV === 'prod' ? 'backend:3000' : 'localhost:3000';
  return await fetch('http://' + host + url, {
    headers: {'Content-Type': 'application/json', authorization: `Bearer ${authToken || ''}`},
    body: body ? JSON.stringify(body) : undefined,
    method,
  })
    .then(async (res) => {
      const type = res.status === 200 ? 'success' : res.status === 401 ? 'info' : 'alert';

      if (res.headers.get('Content-Type')?.includes('application/json')) {
        const message = await res.json();
        return {...message, type};
      } else {
        const message = await res.text();
        return {message, type};
      }
    })
    .catch(() => ({message: 'An error occurred. Please try again later', type: 'alert'}));
}
