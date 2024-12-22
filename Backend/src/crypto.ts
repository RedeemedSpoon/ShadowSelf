import {genSalt, hash, compare} from 'bcrypt';
import {pseudoRandomBytes} from 'crypto';
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

export function genereteID(): string {
  return pseudoRandomBytes(4).toString('hex');
}

export function getAPIKey(): string {
  return pseudoRandomBytes(16).toString('hex');
}

export function getRecovery() {
  return [...new Array(6)].map(() => {
    return Math.floor(Math.random() * 900_000_000) + 100_000_000;
  });
}

export function getSecret(): string {
  return new OTPAuth.Secret({size: 20}).base32;
}

export async function hashPWD(password: string): Promise<string> {
  return await hash(password, await genSalt(10));
}

export async function comparePWD(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}
