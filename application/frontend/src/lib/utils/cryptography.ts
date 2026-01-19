import {p2wpkh} from '@scure/btc-signer';
import {masterPassword} from '$store';
import {HDKey} from '@scure/bip32';
import {get} from 'svelte/store';
import type {Coins} from '$type';

export function deriveXPub(coin: Coins, key: string, index: number = 0): string {
  const LTC_NETWORK = {
    bech32: 'ltc',
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
  };

  const node = HDKey.fromExtendedKey(key);
  const child = node.deriveChild(0).deriveChild(index);

  if (coin === 'btc') return p2wpkh(child.publicKey!).address!;
  else if (coin === 'ltc') return p2wpkh(child.publicKey!, LTC_NETWORK).address!;
  else return key;
}

export async function deriveMasterKey(password: string, identityID: string): Promise<CryptoKey> {
  const salt = new TextEncoder().encode(identityID);
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {name: 'PBKDF2'}, false, ['deriveKey']);

  const algorithm = {
    name: 'PBKDF2',
    salt: salt,
    iterations: 600000,
    hash: 'SHA-256',
  };

  return await crypto.subtle.deriveKey(algorithm, keyMaterial, {name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);
}

export async function getMasterKey() {
  const storedKeyBase64 = get(masterPassword);
  if (!storedKeyBase64) {
    throw new Error('No Master Password loaded in memory.');
  }

  const binaryString = atob(storedKeyBase64);
  const len = binaryString.length;
  const keyBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    keyBytes[i] = binaryString.charCodeAt(i);
  }

  return await crypto.subtle.importKey('raw', keyBytes, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);
}

export async function encrypt(data: string, key?: CryptoKey) {
  key = key || (await getMasterKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);
  const encryptedBuffer = await crypto.subtle.encrypt({name: 'AES-GCM', iv: iv}, key, encodedData);

  const encryptedDataArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  encryptedDataArray.set(iv);
  encryptedDataArray.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...encryptedDataArray));
}

export async function decrypt(encryptedString: string, new_key?: CryptoKey) {
  const key = new_key || (await getMasterKey());

  const encryptedData = new Uint8Array(
    atob(encryptedString)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  const iv = encryptedData.slice(0, 12);
  const dataBuffer = encryptedData.slice(12);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt({name: 'AES-GCM', iv: iv}, key, dataBuffer);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error('Decryption failed', e);
    return '';
  }
}
