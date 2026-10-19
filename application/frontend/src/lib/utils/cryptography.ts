import {p2wpkh} from '@scure/btc-signer';
import {vaultKey} from '$store';
import {HDKey} from '@scure/bip32';
import {get} from 'svelte/store';
import type {Coins} from '$type';

export function deriveXPub(coin: Coins, key: string, index: number = 0): string {
  const node = HDKey.fromExtendedKey(key);
  const child = node.deriveChild(0).deriveChild(index);

  if (coin === 'btc') {
    return p2wpkh(child.publicKey!).address!;
  } else {
    if (coin === 'ltc') {
      return p2wpkh(child.publicKey!, {bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0}).address!;
    } else {
      return key;
    }
  }
}

export async function deriveMasterKey(password: string, identityID: string): Promise<CryptoKey> {
  const salt = new TextEncoder().encode(identityID);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    {name: 'PBKDF2'},
    false,
    ['deriveKey'],
  );

  const algorithm = {
    name: 'PBKDF2',
    salt: salt,
    iterations: 600000,
    hash: 'SHA-256',
  };

  return await crypto.subtle.deriveKey(algorithm, keyMaterial, {name: 'AES-GCM', length: 256}, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function getMasterKey(): Promise<CryptoKey> {
  const key = get(vaultKey);

  if (!key) {
    throw new Error('Unlock your vault with its master password first.');
  }

  return key;
}

export async function encrypt(data: string, key?: CryptoKey) {
  key = key || (await getMasterKey());

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);
  const encryptedBuffer = await crypto.subtle.encrypt({name: 'AES-GCM', iv: iv}, key, encodedData);

  const encryptedDataArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  encryptedDataArray.set(iv);
  encryptedDataArray.set(new Uint8Array(encryptedBuffer), iv.length);

  return 'v1.' + btoa(Array.from(encryptedDataArray, (byte) => String.fromCharCode(byte)).join(''));
}

export async function decrypt(encryptedString: string, newKey?: CryptoKey) {
  if (!encryptedString.startsWith('v1.')) {
    throw new Error('Unsupported encrypted value');
  }

  const key = newKey || (await getMasterKey());

  const encryptedData = new Uint8Array(
    atob(encryptedString.slice(3))
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  const iv = encryptedData.slice(0, 12);
  const dataBuffer = encryptedData.slice(12);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt({name: 'AES-GCM', iv: iv}, key, dataBuffer);

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error(
      'The encrypted value could not be decrypted. Check the master password or restore an intact encrypted backup.',
    );
  }
}
