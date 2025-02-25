import type {PageServerLoad} from './$types';
import {createCookie, fetchApi} from '$lib';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const id = event.url.searchParams.get('id') || '';
  if (!id) redirect(302, '/dashboard');

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const response = await fetchApi('/creation-process', 'POST', {id});
  createCookie(event.cookies, 'creation-process', response.cookie);
  return {cookie: response.cookie || ''};
};
