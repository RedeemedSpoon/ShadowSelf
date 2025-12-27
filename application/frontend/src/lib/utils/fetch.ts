import { NODE_ENV } from '$env/static/private';
import type {APIResponse} from '$type';
import {get} from 'svelte/store';
import {identity} from '$store';
import {token} from '$store';

export async function fetchAPI(url: string, method = 'GET', body?: Record<string, unknown>): Promise<APIResponse> {
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
    headers: {'Content-Type': 'application/json', authorization: `Bearer ${get(token)}`},
  })
    .then(async (res) => {
      const type = res.status === 200 ? 'success' : res.status === 401 ? 'info' : 'alert';
      if (res.headers.get('Content-Type')?.includes('application/json')) {
        const message = await res.json();
        return {...message, type};
      } else {
        const err = await res.text();
        return {err, type};
      }
    })
    .catch(() => ({message: 'An error occurred. Please try again later', type: 'alert'}));
}

export async function fetchBackend(url: string, method = 'GET', body?: Record<string, unknown>) {
  const host = NODE_ENV === 'prod' ? 'backend:3000' : 'localhost:3000';
  return await fetch('http://' + host + url, {
    headers: {'Content-Type': 'application/json', authorization: `Bearer ${get(token)}`},
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
