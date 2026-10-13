import type {MessageInstance} from 'twilio/lib/rest/api/v2010/account/message';
import sharp from 'sharp';
import type {ReservedSql} from 'postgres';
import {ApiError} from '@core/security';

export function reportFailure(operation: string, failure: unknown) {
  const details = failure as {code?: unknown; status?: unknown; name?: unknown} | null;
  const providerCode = typeof details?.code === 'string' && /^(?:[0-9A-Z]{5}|ECONNREFUSED|ECONNRESET|ETIMEDOUT)$/.test(details.code) ? details.code : undefined;
  const category = failure instanceof ApiError ? failure.code : providerCode || (failure instanceof Error ? failure.name : 'UnknownError');
  const status = typeof details?.status === 'number' && details.status >= 400 && details.status < 600 ? details.status : undefined;

  console.error('Operation failed', {operation, category, status});
}

export function error(set: {[key: string]: unknown}, status: number, message: string) {
  set.status = status;

  const codes: Record<number, string> = {
    400: 'invalid_request',
    401: 'unauthenticated',
    402: 'identity_frozen',
    403: 'forbidden',
    404: 'not_found',
    409: 'conflict',
    410: 'expired',
    429: 'rate_limited',
    500: 'request_failed',
    502: 'provider_failed',
    503: 'provider_unavailable',
  };

  return {error: {code: codes[status] || 'request_failed', message}};
}

export async function providerJson(url: string, options?: RequestInit, fetcher: typeof fetch = fetch): Promise<any> {
  const response = await fetcher(url, {...options, signal: options?.signal || AbortSignal.timeout(15_000)});

  if (!response.ok) {
    throw new Error('The provider request failed');
  }

  return await response.json();
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export function net(coin: string) {
  const isUsdt = coin.toLowerCase().includes('usdt');

  return isUsdt ? 'ERC20' : 'Mainnet';
}

export async function normalizePortrait(base64: string) {
  const buffer = Buffer.from(base64, 'base64');
  const resizedBuffer = await sharp(buffer, {limitInputPixels: 16_777_216}).rotate().resize(256, 256).png().toBuffer();

  return resizedBuffer.toString('base64');
}

export function parseMessage(msg: MessageInstance) {
  return {
    messageID: msg.sid,
    status: msg.status,
    date: msg.dateSent || msg.dateCreated,
    error: msg.errorCode ? `${msg.errorCode}: ${msg.errorMessage || 'unknown error'}` : '',
    body: msg.body,
    from: msg.from,
    to: msg.to,
  };
}

export async function withReservedTransaction<T>(connection: ReservedSql, operation: (transaction: ReservedSql) => Promise<T>) {
  await connection`BEGIN`;

  try {
    const result = await operation(connection);
    await connection`COMMIT`;

    return result;
  } catch (error) {
    await connection`ROLLBACK`;

    throw error;
  }
}
