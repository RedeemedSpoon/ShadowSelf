import {notification, pricingModel} from '$store';
import type {Notification} from '$types';
import {allPricingModel} from '$types';
import {get} from 'svelte/store';

export function changePricingModel(model: keyof typeof allPricingModel) {
  document.querySelectorAll('#pricing-model button').forEach((element) => {
    element.classList.remove('selected');
  });

  document.querySelector(`#${model}`)?.classList.add('selected');
  const titleCaseModel = model.charAt(0).toUpperCase() + model.slice(1);
  pricingModel.set({name: titleCaseModel, ...allPricingModel[model]});
}

export function notify(message: Notification['message'], type: Notification['type'] = 'info') {
  const id = Math.floor(Math.random() * 10000);
  notification.set({message, type, id});
  setTimeout(() => {
    if (get(notification).id === id) {
      notification.set({id: null, message: '', type: 'info'});
    }
  }, 5000);
}

export async function fetchApi(url: string, method = 'GET', body?: Record<string, unknown>) {
  return await fetch('http://localhost:3000/api' + url, {
    method,
    headers: {'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined,
  })
    .then((res) => res.json())
    .catch(() => ({message: 'An error occurred. Please try again later.', type: 'alert'}));
}
