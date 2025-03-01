import type {LayoutServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';
import {fetchBackend} from '$lib';
import {token} from '$store';

export const load: LayoutServerLoad = async ({cookies}) => {
  token.set(cookies.get('token') || '');
  const response = await fetchBackend('/account');

  if (response.message === 'Not authorized') {
    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  }

  return {user: response.message || ''};
};
