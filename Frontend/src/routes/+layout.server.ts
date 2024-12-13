import type {LayoutServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';
import {fetchApi} from '$lib';
import {token} from '$store';

export const load: LayoutServerLoad = async ({cookies}) => {
  token.set(cookies.get('token') || '');
  const response = await fetchApi('/account');

  if (response.message === 'Not authorized') {
    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  }

  return {user: response.message || ''};
};
