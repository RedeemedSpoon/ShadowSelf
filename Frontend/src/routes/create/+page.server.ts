import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const id = event.url.searchParams.get('id') || '';
  if (!id) redirect(302, '/dashboard');
  return {id};
};
