import {error, redirect, type Handle} from '@sveltejs/kit';
import {sequence} from '@sveltejs/kit/hooks';
import {fetchBackend} from '$utils/webfetch';
import {ONION_URL} from '$constant';
import csrf from '$utils/csrf';

const authAndRedirects: Handle = async ({event, resolve}) => {
  const token = event.cookies.get('token');
  const path = event.url.pathname;
  const protectedRoute = ['/dashboard', '/settings', '/identity', '/purchase', '/create'].some((route) => path === route || path.startsWith(route + '/'));
  event.locals.user = '';

  if (token) {
    const response = await fetchBackend('/account', 'GET', undefined, token);
    if (response.type === 'alert') error(503, 'Account verification is temporarily unavailable');
    if (response.type === 'success') event.locals.user = response.message;
    else event.cookies.delete('token', {path: '/'});
  }

  const signedIn = !!event.locals.user;

  if (protectedRoute && !signedIn) redirect(303, '/login');
  if (['/login', '/signup'].some((route) => path === route || path.startsWith(route + '/')) && signedIn) redirect(303, '/dashboard');
  if (path === '/identity' || path === '/identity/') redirect(303, '/dashboard');

  const response = await resolve(event);
  if (token || protectedRoute) response.headers.set('cache-control', 'no-store');

  return response;
};

const csrfProtect = csrf([], ['https://shadowself.io', 'https://localhost', ONION_URL]);
export const handle = sequence(csrfProtect, authAndRedirects);
