import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import type {PageServerLoad, Actions} from './$types';
import {fetchBackend} from '$fetch';

export const load: PageServerLoad = async () => {
  return {stripeKey: PUBLIC_STRIPE_KEY};
};

export const actions = {
  init: async ({request}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/checkout?type=${type}`, 'GET');
  },
  confirm: async ({request}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/checkout-after-confirm?type=${type}`, 'GET');
  },
} satisfies Actions;
