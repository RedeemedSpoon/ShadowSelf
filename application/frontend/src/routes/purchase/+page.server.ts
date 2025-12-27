import { STRIPE_PUBLISHABLE_KEY } from '$env/static/private';
import type {PageServerLoad, Actions} from './$types';
import {fetchBackend} from '$fetch';

export const load: PageServerLoad = async () => {
  return {stripeKey: STRIPE_PUBLISHABLE_KEY};
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
