import {redirect, type Handle} from '@sveltejs/kit';
import {sequence} from '@sveltejs/kit/hooks';
import csrf from '$csrf';

const csrfProtect = csrf([], ['https://shadowself.io', 'https://localhost']);
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

export const handle = sequence(csrfProtect, authAndRedirects);
