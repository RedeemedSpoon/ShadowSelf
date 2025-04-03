import type {Actions, PageServerLoad} from './$types';
import type {FullIdentity} from '$type';
import {redirect} from '@sveltejs/kit';
import {fetchBackend} from '$fetch';

export const load: PageServerLoad = async ({params}) => {
  const response = (await fetchBackend('/api/identity/' + params.slug)) as FullIdentity;
  if (!response.id) return {slug: params.slug, identity: null};
  return {slug: params.slug, identity: response};
};

export const actions: Actions = {
  default: async ({request}) => {
    const data = await request.formData();
    if (data.get('delete')) return;

    const response = await fetchBackend('/billing/cancel', 'DELETE', {id: data.get('id')});
    if (!response.success) return response;

    redirect(302, '/dashboard');
  },
};
