import type {PageServerLoad, Actions} from './$types';
import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import {fetchBackend} from '$utils/webfetch';

export const load: PageServerLoad = async () => {
  return {stripeKey: PUBLIC_STRIPE_KEY};
};

export const actions = {
  fiatInit: async ({request, cookies}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/fiat/checkout?type=${type}`, 'GET', undefined, cookies.get('token'));
  },
  fiatConfirm: async ({request, cookies}) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString().toLowerCase();
    return await fetchBackend(`/billing/fiat/checkout-after-confirm?type=${type}`, 'GET', undefined, cookies.get('token'));
  },
  cryptoInit: async ({request, cookies}) => {
    const formData = await request.formData();
    const plan = formData.get('plan')?.toString().toLowerCase();
    const swapCoin = formData.get('swapCoin')?.toString().toLowerCase();
    const refundAddress = formData.get('refundAddress')?.toString();

    return await fetchBackend(`/billing/crypto/new-invoice`, 'POST', {plan, swapCoin, refundAddress}, cookies.get('token'));
  },
  cryptoRenew: async ({request, cookies}) => {
    const formData = await request.formData();
    const plan = formData.get('plan')?.toString().toLowerCase();
    const swapCoin = formData.get('swapCoin')?.toString().toLowerCase();
    const refundAddress = formData.get('refundAddress')?.toString();
    const id = formData.get('id')?.toString();

    return await fetchBackend(`/billing/crypto/renew`, 'POST', {plan, swapCoin, refundAddress, id}, cookies.get('token'));
  },
} satisfies Actions;
