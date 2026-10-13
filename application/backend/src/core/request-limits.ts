import {ApiError} from '@core/security';
import {VERIFICATION_CAPACITY} from '@core/constants';
import {isIP} from 'node:net';

function normalizeIP(value: string) {
  return value.startsWith('::ffff:') ? value.slice(7) : value;
}

export function requestClientIP(peer: string, forwarded: string | null, trusted: readonly string[]) {
  const direct = normalizeIP(peer);
  const proxies = trusted.map(normalizeIP);

  if (!proxies.includes(direct) || !forwarded) {
    return direct;
  }

  const addresses = forwarded.split(',').map((ip) => normalizeIP(ip.trim()));

  if (addresses.length > 10 || !addresses.every((ip) => isIP(ip))) {
    return direct;
  }

  let candidate = direct;

  for (const address of addresses.reverse()) {
    if (!proxies.includes(candidate)) {
      break;
    }

    candidate = address;
  }

  return candidate;
}

export function createRequestLimiter(now = Date.now) {
  const windows = new Map<string, {count: number; expiresAt: number}>();
  let nextCleanup = 0;

  const cleanup = (current: number) => {
    for (const [key, entry] of windows) {
      if (entry.expiresAt <= current) {
        windows.delete(key);
      }
    }

    nextCleanup = current + 1000;
  };

  return (key: string, limit: number, duration: number) => {
    const current = now();

    if (current >= nextCleanup) {
      cleanup(current);
    }

    const previous = windows.get(key);

    if (previous && previous.expiresAt <= current) {
      windows.delete(key);
    }

    const entry = windows.get(key) || {count: 0, expiresAt: current + duration};

    if (entry.count >= limit) {
      throw new ApiError(429, 'rate_limited', 'Too many requests. Wait before retrying');
    }

    if (!windows.has(key) && windows.size >= VERIFICATION_CAPACITY) {
      cleanup(current);

      if (windows.size >= VERIFICATION_CAPACITY) {
        throw new ApiError(503, 'capacity_exceeded', 'The service is busy. Retry shortly');
      }
    }

    entry.count++;
    windows.set(key, entry);
  };
}
