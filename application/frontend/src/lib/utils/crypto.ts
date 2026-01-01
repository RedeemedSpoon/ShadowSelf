import {masterPassword} from '$store';
import {get} from 'svelte/store';

const APP_SALT = new TextEncoder().encode('ShadowSelf-Secure-Salt');

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
  const password = get(masterPassword);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), {name: 'PBKDF2'}, false, ['deriveKey']);

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: APP_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {name: 'AES-GCM', length: 256},
    true,
    ['encrypt', 'decrypt'],
  );
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

export async function decrypt(encryptedString: string) {
  const key = await getMasterKey();

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
