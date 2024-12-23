import type {PageServerLoad, Actions} from './$types';
import {loadStripe} from '@stripe/stripe-js';

export const load: PageServerLoad = async () => {
  return {stripe: await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!)};
};

export const actions = {
  default: async ({request}) => {},
} satisfies Actions;
