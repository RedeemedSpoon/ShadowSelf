import {PUBLIC_NODE_ENV} from '$env/static/public';
import type {APIResponse} from '$type';
import {identity} from '$store';
import {get} from 'svelte/store';

export async function fetchAPI<Type = APIResponse>(url: string, method = 'GET', body?: Record<string, unknown>): Promise<Type> {
  if (body && method !== 'GET' && url.startsWith('account/')) body = {...body, encryptionVersion: get(identity).encryptionVersion};

  let fullUrl = `/api/${url}/${get(identity).id}`;
  if (method === 'GET' && body) {
    let index = 0;
    for (const [key, value] of Object.entries(body)) {
      if (index === 0) fullUrl += `?${key}=${encodeURIComponent(value as string)}`;
      else fullUrl += `&${key}=${encodeURIComponent(value as string)}`;
      index++;
    }
  }

  return await fetch(fullUrl, {
    method,
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
    headers: {'Content-Type': 'application/json'},
  })
    .then(async (res) => {
      const type = res.status === 200 ? 'success' : res.status === 401 ? 'info' : 'alert';
      if (res.headers.get('Content-Type')?.includes('application/json')) {
        const message = await res.json();
        if (!res.ok) return {err: message.message || message.error || 'Request failed', type};
        if (res.ok && Number.isSafeInteger(message.encryptionVersion)) identity.update((value) => ({...value, encryptionVersion: message.encryptionVersion}));
        return {...message, type};
      } else {
        const err = await res.text();
        return {err, type};
      }
    })
    .catch(() => ({err: 'An error occurred. Please try again later', type: 'alert'}));
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
