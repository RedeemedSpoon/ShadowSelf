import type {LayoutServerLoad} from './$types';
import {error, redirect} from '@sveltejs/kit';
import {fetchBackend} from '$fetch';
import {token, user} from '$store';
import {get} from 'svelte/store';

export const load: LayoutServerLoad = async ({cookies, url}) => {
  token.set(cookies.get('token') || '');
  const response = await fetchBackend('/account');

  if (response.message === 'You are not logged in') return {user: '', token: get(token)};
  else if (response.message === 'An error occurred. Please try again later') error(500, 'Server error');
  else if (response.message === 'Not authorized') {
    cookies.delete('token', {path: '/'});
    url.pathname !== '/' && redirect(302, '/');
  }

  const username = response.message || user;
  return {user: username, token: get(token)};
};
