import {createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes} from 'node:crypto';
import {secretSauce} from '@core/config';

const encryptionKey = Buffer.from(hkdfSync('sha256', secretSauce, 'shadowself', 'server-secrets-v1', 32));

export function encryptSecret(value: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

  return `sealed.v1.${Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64url')}`;
}

export function decryptSecret(value: string) {
  if (!value.startsWith('sealed.v1.')) {
    throw new Error('Invalid encrypted server secret');
  }

  const payload = Buffer.from(value.slice(10), 'base64url');

  if (payload.length < 29) {
    throw new Error('Invalid encrypted server secret');
  }

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));

  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
}

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionToken() {
  return `ss_session_${randomBytes(32).toString('base64url')}`;
}

export function apiToken() {
  return `ss_api_${randomBytes(32).toString('base64url')}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function requireProvider(configured: boolean, name: string) {
  if (!configured) {
    throw new ApiError(503, 'provider_unavailable', `${name} is unavailable`);
  }
}
