import type {Handle} from '@sveltejs/kit';
import {redirect} from '@sveltejs/kit';

export const handle: Handle = async ({event, resolve}) => {
  const path = event.url.pathname;

  if (path === '/logout') {
    event.cookies.delete('token', {path: '/'});
    redirect(302, '/');
  }

  if (path.startsWith('/api') || path.startsWith('/extension-api')) {
    const response = await fetch(`http://localhost:3000${event.url.pathname}`, event.request)
      .then((res) => res.json())
      .catch((error) => ({message: error.message, type: 'alert'}));

    return new Response(JSON.stringify(response), {headers: {'Content-Type': 'application/json'}});
  }

  return resolve(event);
};
