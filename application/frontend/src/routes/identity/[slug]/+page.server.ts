import type {Actions, PageServerLoad} from './$types';
import {fetchBackend} from '$utils/webfetch';
import type {FullIdentity} from '$type';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async ({params, cookies}) => {
  const response = (await fetchBackend('/api/identity/' + params.slug, 'GET', undefined, cookies.get('token'))) as FullIdentity;
  if ((response as any).message === 'Identity is frozen') return {slug: params.slug, identity: null, isFrozen: true};
  if (!response.id) return {slug: params.slug, isFrozen: false, identity: null};
  return {slug: params.slug, identity: response, isFrozen: false};
};

export const actions: Actions = {
  default: async ({request, cookies}) => {
    const data = await request.formData();
    if (data.get('delete')) return;

    const response = await fetchBackend('/billing/cancel', 'DELETE', {id: data.get('id')}, cookies.get('token'));
    if (!response.success) return response;

    redirect(302, '/dashboard');
  },
};
