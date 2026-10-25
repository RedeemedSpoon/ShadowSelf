import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {backend} from '$lib/backend.server';

export const POST: RequestHandler = async ({cookies, setHeaders}) => {
  setHeaders({'cache-control': 'no-store'});

  const result = await backend<{clientSecret: string}>('/settings/payment-setup', 'POST', {}, cookies.get('token'));

  if (!result.ok) {
    return json({error: result.error}, {status: result.status || 503});
  }

  return json(result.data);
};
