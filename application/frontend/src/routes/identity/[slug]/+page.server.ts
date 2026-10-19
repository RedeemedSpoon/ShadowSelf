import type {Actions, PageServerLoad} from './$types';
import {backend} from '$lib/backend.server';
import type {IdentityMetadata} from '$type';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async ({params, cookies}) => {
  const result = await backend<IdentityMetadata>(`/identities/${params.slug}`, 'GET', undefined, cookies.get('token'));

  return {
    slug: params.slug,
    identity: result.ok ? result.data : null,
    loadError: result.ok ? '' : result.error,
    status: result.ok ? 200 : result.status,
  };
};

export const actions: Actions = {
  delete: async ({request, cookies, params}) => {
    const currentPassword = (await request.formData()).get('currentPassword');

    const result = await backend(`/identities/${params.slug}`, 'DELETE', {currentPassword}, cookies.get('token'));

    if (!result.ok) {
      return {message: result.error};
    }

    redirect(303, '/dashboard');
  },
};
