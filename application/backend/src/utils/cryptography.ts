import {genSalt, hash, compare} from 'bcryptjs';
import {LTC_NETWORK} from '@core/constants';
import {p2wpkh} from '@scure/btc-signer';
import {secretSauce} from '@core/config';
import {randomBytes} from 'crypto';
import {HDKey} from '@scure/bip32';
import * as OTPAuth from 'otpauth';

export function xpubToAddress(coin: 'btc' | 'ltc', xpub: string, index: number = 0): string {
  const node = HDKey.fromExtendedKey(xpub);
  const child = node.deriveChild(0).deriveChild(index);

  if (coin === 'btc') return p2wpkh(child.publicKey!).address!;
  if (coin === 'ltc') return p2wpkh(child.publicKey!, LTC_NETWORK).address!;
  else return '';
}

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
  return Bun.hash(string + secretSauce).toString();
}

export async function createHash(string: string): Promise<string> {
  return await hash(string, await genSalt(10));
}

export async function compareHash(string: string, hash: string): Promise<boolean> {
  return await compare(string, hash);
}
