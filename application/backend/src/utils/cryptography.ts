import {genSalt, hash, compare} from 'bcryptjs';
import {p2wpkh} from '@scure/btc-signer';
import {secretSauce} from '@core/config';
import {createHash as createDigest, createHmac, randomBytes, randomInt, timingSafeEqual} from 'crypto';
import {HDKey} from '@scure/bip32';
import * as OTPAuth from 'otpauth';

const CREATION_PROCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const creationProcessTokens = new Map<string, CreationProcessTokenRecord>();

type CreationProcessTokenBinding = {
  identityID: string;
  sessionToken: string;
  userID: number | string;
};

type CreationProcessTokenRecord = {
  expiresAt: number;
  identityID: string;
  sessionHash: string;
  userID: string;
};

export function xpubToAddress(coin: 'btc' | 'ltc', xpub: string, index: number = 0): string {
  const node = HDKey.fromExtendedKey(xpub);
  const child = node.deriveChild(0).deriveChild(index);

  if (coin === 'btc') return p2wpkh(child.publicKey!).address!;
  if (coin === 'ltc') return p2wpkh(child.publicKey!, {bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0}).address!;
  else return '';
}

export function createTOTP(secret: string, username: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    label: username,
    issuer: 'ShadowSelf',
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

export function generateProxyPassword(): string {
  return randomBytes(16).toString('hex');
}

export function generateEmailAccessCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function generateEmailVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export function getRecovery() {
  const codes = new Set<number>();

  while (codes.size < 6) {
    codes.add(randomInt(100_000_000, 1_000_000_000));
  }

  return [...codes];
}

export function checksum(string: string): string {
  return Bun.hash(string + secretSauce).toString();
}

export function createCreationProcessToken(binding: CreationProcessTokenBinding): string {
  pruneCreationProcessTokens();

  const nonce = randomBytes(32).toString('base64url');
  const signature = signCreationProcessNonce(nonce);
  const token = `${nonce}.${signature}`;

  creationProcessTokens.set(digest(token), {
    expiresAt: Date.now() + CREATION_PROCESS_TOKEN_TTL_MS,
    identityID: binding.identityID,
    sessionHash: digest(binding.sessionToken),
    userID: String(binding.userID),
  });

  return token;
}

export function consumeCreationProcessToken(token: string, binding: CreationProcessTokenBinding) {
  if (!hasValidCreationProcessSignature(token)) return 'mismatch';

  const tokenHash = digest(token);
  const record = creationProcessTokens.get(tokenHash);
  if (!record) return 'missing';

  if (record.expiresAt <= Date.now()) {
    creationProcessTokens.delete(tokenHash);
    return 'expired';
  }

  const sessionHash = digest(binding.sessionToken);
  const mismatch =
    record.identityID !== binding.identityID ||
    record.userID !== String(binding.userID) ||
    !sameDigest(record.sessionHash, sessionHash);
  if (mismatch) return 'mismatch';

  creationProcessTokens.delete(tokenHash);
}

export async function createHash(string: string): Promise<string> {
  return await hash(string, await genSalt(10));
}

export async function compareHash(string: string, hash: string): Promise<boolean> {
  return await compare(string, hash);
}

function signCreationProcessNonce(nonce: string) {
  return createHmac('sha256', secretSauce).update(nonce).digest('base64url');
}

function hasValidCreationProcessSignature(token: string) {
  const [nonce, signature] = token.split('.');
  if (!nonce || !signature || token.split('.').length !== 2) return false;

  return sameDigest(signature, signCreationProcessNonce(nonce));
}

function digest(value: string) {
  return createDigest('sha256').update(value).digest('base64url');
}

function sameDigest(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function pruneCreationProcessTokens() {
  const now = Date.now();
  for (const [tokenHash, record] of creationProcessTokens) {
    if (record.expiresAt <= now) creationProcessTokens.delete(tokenHash);
  }
}
