import type {LayoutServerLoad} from './$types';
import {error, redirect} from '@sveltejs/kit';
import {fetchBackend} from '$fetch';

export const load: LayoutServerLoad = async ({cookies, url}) => {
  const currentToken = cookies.get('token') || '';
  const response = await fetchBackend('/account', 'GET', undefined, currentToken);

  if (response.message === 'You are not logged in') return {user: '', token: currentToken};
  else if (response.message === 'An error occurred. Please try again later') error(500, 'Server error');
  else if (response.message === 'Not authorized') {
    cookies.delete('token', {path: '/'});
    if (url.pathname !== '/') redirect(302, '/');
  }

  const username = response.message || '';
  return {user: username, token: currentToken};
};
