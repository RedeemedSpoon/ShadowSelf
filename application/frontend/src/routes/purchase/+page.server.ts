import type {PageServerLoad, Actions} from './$types';
import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import {fetchBackend} from '$utils/webfetch';

export const load: PageServerLoad = async () => {
  return {stripeKey: PUBLIC_STRIPE_KEY};
};

export const actions = {
  init: async ({request, cookies}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/fiat/checkout?type=${type}`, 'GET', undefined, cookies.get('token'));
  },
  confirm: async ({request, cookies}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/fiat/checkout-after-confirm?type=${type}`, 'GET', undefined, cookies.get('token'));
  },
} satisfies Actions;
