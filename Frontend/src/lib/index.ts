import {notification, showModal, pricingModel, fetching} from '$store';
import type {Cookies} from '@sveltejs/kit';
import type {Notification} from '$type';
import {allPricingModel} from '$type';
import {dev} from '$app/environment';
import {get} from 'svelte/store';
import {token} from '$store';

export function changePricingModel(model: string) {
  const chosenModel = model.toLowerCase() as keyof typeof allPricingModel;
  pricingModel.set({name: model, ...allPricingModel[chosenModel]});

  const margin = model === 'Monthly' ? '0%' : model === 'Annually' ? '33%' : '66%';
  const element = document.querySelector('#select-model-box') as HTMLElement;
  element.style.left = margin;
}

export function notify(message: string, type: Notification['type'] = 'info') {
  const id = Math.floor(Math.random() * 10000);
  notification.set({message, type, id});
  setTimeout(() => {
    if (get(notification).id === id) {
      notification.set({id: null, message: '', type: 'info'});
    }
  }, 5000);
}

export async function sendFrom(shouldWait = false, index = 1, condition = true) {
  if (condition) fetching.set(index);
  if (shouldWait) await new Promise((resolve) => setTimeout(resolve, 600));

  return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
    fetching.set(0);
    update({reset: false});
  };
}

export async function setModal(index = 1, condition = true) {
  if (condition) showModal.set(0);
  else showModal.set(index);

  return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
    update({reset: false});
  };
}

export async function fetchApi(url: string, method = 'GET', body?: Record<string, unknown>) {
  return await fetch('http://localhost:3000' + url, {
    headers: {'Content-Type': 'application/json', authorization: `Bearer ${get(token)}`},
    body: body ? JSON.stringify(body) : undefined,
    method,
  })
    .then(async (res) => {
      const type = res.status === 200 ? 'success' : res.status === 401 ? 'info' : 'alert';

      if (res.headers.get('Content-Type')?.includes('application/json')) {
        const message = await res.json();
        return {...message, type};
      } else {
        const message = await res.text();
        return {message, type};
      }
    })
    .catch(() => ({message: 'An error occurred. Please try again later', type: 'alert'}));
}

export function createCookie(cookies: Cookies, name: string, value: string, short: boolean = false) {
  return cookies.set(name, value, {
    path: '/',
    httpOnly: true,
    secure: true,
    domain: dev ? 'localhost' : 'shadowself.io',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxAge: short ? 3_600_000 : 2_592_000_000,
    sameSite: 'strict',
    priority: 'high',
  });
}
