import {redirect, type Handle} from '@sveltejs/kit';

export const handle: Handle = async ({event, resolve}) => {
  const isLogged = event.cookies.get('token');
  const path = event.url.pathname;

  if (path === '/identity' || path === '/identity/') {
    redirect(302, '/dashboard');
  }

  if (['/login', '/signup'].includes(path) && isLogged) {
    redirect(302, '/dashboard');
  }

  if (['/dashboard', '/settings', '/identity/', '/purchase', '/create'].includes(path) && !isLogged) {
    redirect(302, '/login');
  }

  if (path === '/logout') {
    event.cookies.delete('token', {path: '/'});
    redirect(302, '/');
  }

  return resolve(event);
};
