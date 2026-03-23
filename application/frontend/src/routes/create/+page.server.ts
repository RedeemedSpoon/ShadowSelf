import type {PageServerLoad} from './$types';
import {fetchBackend} from '$utils/webfetch';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const id = event.url.searchParams.get('id') || '';
  if (!id) redirect(302, '/dashboard');

  const response = await fetchBackend('/creation-process', 'POST', {id}, event.cookies.get('token'));
  createCookie(event.cookies, 'creation-process', response.cookie);

  return {cookie: response.cookie || ''};
};
