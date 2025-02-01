import {createCookie} from '$lib';
import type {PageServerLoad} from './$types';
import type {Actions} from './$types';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const id = event.url.searchParams.get('id') || '';
  if (!id) redirect(302, '/dashboard');
  return {id};
};

export const actions: Actions = {
  cookie: async ({request, cookies}) => {
    const form = await request.formData();
    const cookie = form.get('cookie-value') as string;
    createCookie(cookies, 'creation-process', cookie);
  },
};
