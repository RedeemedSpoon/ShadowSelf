import {backend} from '$lib/backend.server';
import type {BillingReceipt} from '$type';
import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({params, url}) => {
  const access = url.searchParams.get('access') || '';
  const result = await backend<BillingReceipt>(`/billing/receipts/${params.id}?access=${encodeURIComponent(access)}`);

  if (!result.ok) {
    error(result.status || 503, result.error);
  }

  return {receipt: result.data, access};
};
