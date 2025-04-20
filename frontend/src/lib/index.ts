import {notification, modalIndex, fetchIndex} from '$store';
import type {Cookies} from '@sveltejs/kit';
import type {Notification} from '$type';
import {dev} from '$app/environment';
import {get} from 'svelte/store';

export function notify(message: string, type: Notification['type'] = 'info') {
  const id = Math.floor(Math.random() * 10000);
  notification.set({message, type, id});
  setTimeout(() => {
    if (get(notification).id === id) {
      notification.set({id: null, message: '', type: 'info'});
    }
  }, 5000);
}

export async function updateFetch(shouldWait = false, index = 1, condition = true) {
  if (condition) fetchIndex.set(index);
  if (shouldWait) await new Promise((resolve) => setTimeout(resolve, 650));

  return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
    fetchIndex.set(0);
    update({reset: false});
  };
}

export async function updateModal(index = 1, condition = true) {
  if (!condition) modalIndex.set(0);
  else modalIndex.set(index);

  return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
    update({reset: false});
  };
}

export function createCookie(cookies: Cookies, name: string, value: string, short: boolean = false) {
  return cookies.set(name, value, {
    path: '/',
    domain: dev ? 'localhost' : 'shadowself.io',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxAge: short ? 3_600_000 : 2_592_000_000,
    sameSite: 'strict',
    secure: true,
  });
}

export function base64ToBlob(base64: string, type = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type});
  return blob;
}
