import {notification, activeModal, pendingID} from '$store';
import type {Cookies} from '@sveltejs/kit';
import type {Notification} from '$type';
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

export async function awaitPending(shouldWait = false, index = 1, condition = true) {
  if (condition) pendingID.set(index);
  if (shouldWait) await new Promise((resolve) => setTimeout(resolve, 650));

  return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
    pendingID.set(0);
    update({reset: false});
  };
}

export async function triggerModal(index = 1, condition = true) {
  if (!condition) activeModal.set(0);
  else activeModal.set(index);

  return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
    update({reset: false});
  };
}

export function createCookie(cookies: Cookies, name: string, value: string, short: boolean = false) {
  const ninetyDays = 7_776_000_000;
  const oneHour = 3_600_000;

  return cookies.set(name, value, {
    path: '/',
    secure: true,
    sameSite: 'strict',
    expires: new Date(Date.now() + (short ? oneHour : ninetyDays)),
    maxAge: short ? oneHour : ninetyDays,
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
