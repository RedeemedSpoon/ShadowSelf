import type {QueryResult} from './types';

export async function attempt(func: Promise<unknown>): Promise<QueryResult[]> {
  try {
    return (await func) as QueryResult[];
  } catch (error) {
    return error as QueryResult[];
  }
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export async function request(url: string, method = 'GET', body?: object) {
  return fetch('http://localhost:3000' + url, {
    headers: {'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined,
    method,
  })
    .then((res) => res.json())
    .catch((err) => err);
}
