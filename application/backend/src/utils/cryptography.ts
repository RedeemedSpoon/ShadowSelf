import {decryptSecret} from '@core/security';
import {p2wpkh} from '@scure/btc-signer';
import {secretSauce} from '@core/config';
import {randomBytes, createHmac} from 'node:crypto';
import {HDKey} from '@scure/bip32';
import * as OTPAuth from 'otpauth';

export function xpubToAddress(coin: 'btc' | 'ltc', xpub: string, index: number = 0, branch: 0 | 1 = 0): string {
  const node = HDKey.fromExtendedKey(xpub);
  const child = node.deriveChild(branch).deriveChild(index);

  if (coin === 'btc') {
    return p2wpkh(child.publicKey!).address!;
  }

  if (coin === 'ltc') {
    return p2wpkh(child.publicKey!, {bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0}).address!;
  } else {
    return '';
  }
}

export function createTOTP(secret: string, username: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    label: username,
    issuer: 'ShadowSelf',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret.startsWith('sealed.v1.') ? decryptSecret(secret) : secret,
  });
}

export function getSecret(): string {
  return new OTPAuth.Secret({size: 20}).base32;
}

export function generateIdentityID(): string {
  return randomBytes(6).toString('hex');
}

export function getRecovery() {
  return Array.from({length: 6}, () => randomBytes(12).toString('hex').match(/.{6}/g)!.join('-'));
}

export async function createHash(string: string): Promise<string> {
  return await Bun.password.hash(string, {algorithm: 'argon2id', memoryCost: 65536, timeCost: 3});
}

export async function compareHash(string: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(string, hash);
}

export function hashVerification(value: string) {
  return createHmac('sha256', secretSauce).update(value).digest('hex');
}

export function hashRecoveryCode(value: string) {
  return hashVerification(`recovery:${value.trim().toLowerCase()}`);
}
