import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const token = event.url.searchParams.get('token') || '';
  if (!token) redirect(302, 'dashboard/');
  return {token};
};
