import {masterPassword} from '$store';
import {get} from 'svelte/store';

const iv = new Uint8Array(12).fill(0x01);

export async function getMasterKey() {
  const keyBuffer = new Uint8Array(
    atob(get(masterPassword))
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  return await crypto.subtle.importKey('raw', keyBuffer, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);
}

export async function encrypt(unencryptedPassword: string, key?: CryptoKey) {
  key = key || (await getMasterKey());

  const encodedPassword = new TextEncoder().encode(unencryptedPassword);
  const encryptedBuffer = await crypto.subtle.encrypt({name: 'AES-GCM', iv: iv}, key, encodedPassword);
  const encryptedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);

  encryptedData.set(iv);
  encryptedData.set(new Uint8Array(encryptedBuffer), iv.length);

  //@ts-expect-error Type 'Uint8Array' is not assignable to type 'string'.
  return btoa(String.fromCharCode.apply(null, encryptedData));
}

export async function decrypt(encryptedPassword: string) {
  const key = await getMasterKey();

  const encryptedData = new Uint8Array(
    atob(encryptedPassword)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  const encryptedPasswordBuffer = encryptedData.slice(12);
  try {
    const decryptedBuffer = await crypto.subtle.decrypt({name: 'AES-GCM', iv: iv}, key, encryptedPasswordBuffer);
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return 'unable to decrypt';
  }
}
