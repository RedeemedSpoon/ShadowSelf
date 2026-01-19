import {genSalt, hash, compare} from 'bcryptjs';
import {randomBytes} from 'crypto';
import * as OTPAuth from 'otpauth';

export function createTOTP(secret: string, username: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    label: username,
    issuer: 'ShadowSelf',
    algorithm: 'SHA512',
    digits: 6,
    period: 30,
    secret,
  });
}

export function getSecret(): string {
  return new OTPAuth.Secret({size: 20}).base32;
}

export function generateID(): string {
  return randomBytes(4).toString('hex');
}

export function generateIdentityID(): string {
  return randomBytes(6).toString('hex');
}

export function getAPIKey(): string {
  return randomBytes(16).toString('hex');
}

export function generateProxyPassword() {
  return randomBytes(16).toString('hex');
}

export function getRecovery() {
  return [...new Array(6)].map(() => {
    return Math.floor(Math.random() * 900_000_000) + 100_000_000;
  });
}

export function checksum(string: string): string {
  return Bun.hash(string + process.env.SECRET_SAUCE).toString();
}

export async function createHash(string: string): Promise<string> {
  return await hash(string, await genSalt(10));
}

export async function compareHash(string: string, hash: string): Promise<boolean> {
  return await compare(string, hash);
}
