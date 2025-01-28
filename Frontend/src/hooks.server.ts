import type {Handle} from '@sveltejs/kit';
import {redirect} from '@sveltejs/kit';

export const handle: Handle = async ({event, resolve}) => {
  const isLogged = event.cookies.get('token');
  const path = event.url.pathname;

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

  if (path === '/webhook' && event.request.method === 'POST') {
    const response = await fetch(`http://localhost:3000/billing/webhook`, event.request)
      .then((res) => res.json())
      .catch((error) => ({message: error.message}));

    return new Response(JSON.stringify(response), {headers: {'Content-Type': 'application/json'}});
  }

  if (path.startsWith('/api') || path.startsWith('/extension')) {
    const response = await fetch(`http://localhost:3000${path}`, event.request)
      .then((res) => res.json())
      .catch((error) => ({message: error.message, type: 'alert'}));

    return new Response(JSON.stringify(response), {headers: {'Content-Type': 'application/json'}});
  }

  return resolve(event);
};
