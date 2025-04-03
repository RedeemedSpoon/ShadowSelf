import type {PageServerLoad, Actions} from './$types';
import {fetchBackend} from '$fetch';

export const load: PageServerLoad = async () => {
  return {stripeKey: process.env.STRIPE_PUBLISHABLE_KEY};
};

export const actions = {
  default: async ({request}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/checkout?type=${type}`, 'GET');
  },
} satisfies Actions;
