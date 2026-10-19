import {backend} from '$lib/backend.server';
import {redirect} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({url, cookies}) => {
  const id = url.searchParams.get('id');

  if (!id) {
    redirect(303, '/dashboard');
  }

  const result = await backend<{
    draft: Record<string, unknown>;
    status: string;
    creationStatus: 'editing' | 'provisioning' | 'completed';
  }>(`/identities/${id}/creation`, 'GET', undefined, cookies.get('token'));

  if (result.ok && result.data.creationStatus === 'completed') {
    redirect(303, `/identity/${id}`);
  }

  return {id, creation: result.ok ? result.data : null, loadError: result.ok ? '' : result.error};
};
