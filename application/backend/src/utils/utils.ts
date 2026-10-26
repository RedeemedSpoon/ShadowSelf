import sharp from 'sharp';
import type {ReservedSql} from 'postgres';
import {ApiError} from '@core/security';
import {SWAP_NETWORKS} from '@core/constants';

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

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export function net(coin: string) {
  const network = Object.hasOwn(SWAP_NETWORKS, coin) ? SWAP_NETWORKS[coin] : undefined;

  if (!network) {
    throw new ApiError(400, 'invalid_coin', 'Choose a supported asset and network');
  }

  return network;
}

export async function normalizePortrait(base64: string) {
  const buffer = Buffer.from(base64, 'base64');
  const resizedBuffer = await sharp(buffer, {limitInputPixels: 16_777_216}).rotate().resize(256, 256).png().toBuffer();

  return resizedBuffer.toString('base64');
}

export async function withReservedTransaction<T>(
  connection: ReservedSql,
  operation: (transaction: ReservedSql) => Promise<T>,
) {
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
