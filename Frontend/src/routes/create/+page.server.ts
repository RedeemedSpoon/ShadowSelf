import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';
import {fetchBackend} from '$fetch';
import {createCookie} from '$lib';

export const load: PageServerLoad = async (event) => {
  const id = event.url.searchParams.get('id') || '';
  if (!id) redirect(302, '/dashboard');

  await new Promise((resolve) => setTimeout(resolve, 1500));
  const response = await fetchBackend('/creation-process', 'POST', {id});
  createCookie(event.cookies, 'creation-process', response.cookie);
  return {cookie: response.cookie || ''};
};
