import {env} from '$env/dynamic/public';
import {backend} from '$lib/backend.server';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({cookies}) => {
  const result = await backend<{creationAvailable: boolean}>(
    '/billing/availability',
    'GET',
    undefined,
    cookies.get('token'),
  );

  return {
    stripeKey: env.PUBLIC_STRIPE_KEY || '',
    requestID: crypto.randomUUID(),
    creationAvailable: result.ok && result.data.creationAvailable,
    availabilityError: result.ok ? '' : result.error,
  };
};
