import type {Actions, PageServerLoad} from './$types';
import {fetchBackend} from '$utils/webfetch';
import type {FullIdentity} from '$type';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async ({params, cookies}) => {
  const response = (await fetchBackend('/api/identity/' + params.slug, 'GET', undefined, cookies.get('token'))) as FullIdentity;

  const slug = params.slug;
  const message = (response as any)?.message as string | undefined;

  if (message?.startsWith('Identity is frozen')) {
    const subsPlan = message.includes('monthly') ? 'monthly' : 'annually';
    const cryptoUse = message.includes('crypto') ? true : false;
    return {slug, identity: null, isFrozen: true, subsPlan, cryptoUse};
  }

  if (!response.id) return {slug, isFrozen: false, identity: null};
  else return {slug, identity: response, isFrozen: false};
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
