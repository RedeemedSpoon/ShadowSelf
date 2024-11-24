import {genSalt, hash, compare} from 'bcrypt';
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

export function getRecovery(): string[] {
  const recovery: string[] = [];
  for (let i = 0; i < 6; i++) {
    const code = Math.floor(Math.random() * 900_000_000) + 100_000_000;
    recovery.push(code.toString());
  }

  return recovery;
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
