import type {LayoutServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';
import {fetchBackend} from '$fetch';
import {get} from 'svelte/store';
import {token} from '$store';

export const load: LayoutServerLoad = async ({cookies}) => {
  token.set(cookies.get('token') || '');
  const response = await fetchBackend('/account');

  if (response.message === 'Not authorized') {
    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  }

  const user = response.message || '';
  return {user, token: get(token)};
};
