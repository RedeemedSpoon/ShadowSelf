import {redirect, type Handle} from '@sveltejs/kit';
import {sequence} from '@sveltejs/kit/hooks';
import {ONION_URL} from '$constant';
import csrf from '$utils/csrf';

const authAndRedirects: Handle = async ({event, resolve}) => {
  const isLogged = event.cookies.get('token');
  const path = event.url.pathname;

  if (path === '/logout') {
    event.cookies.delete('token', {path: '/'});
    redirect(302, '/');
  }

  if (path === '/identity' || path === '/identity/') {
    redirect(302, '/dashboard');
  }

  if (['/login', '/signup'].includes(path) && isLogged) {
    redirect(302, '/dashboard');
  }

  if (['/dashboard', '/settings', '/identity/', '/purchase', '/create'].includes(path) && !isLogged) {
    redirect(302, '/login');
  }

  return resolve(event);
};

const csrfProtect = csrf([], ['https://shadowself.io', 'https://localhost', ONION_URL]);
export const handle = sequence(csrfProtect, authAndRedirects);
