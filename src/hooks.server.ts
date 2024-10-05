import type {Handle, HandleServerError} from '@sveltejs/kit';

export const handle: Handle = async ({event, resolve}) => {
  if (event.url.pathname.startsWith('/api')) {
    const response = await fetch(`http://localhost:3000${event.url.pathname}`, event.request)
      .then((res) => res.json())
      .catch(() => ({message: 'An error occurred. Please try again later.'}));

    return new Response(JSON.stringify(response), {headers: {'Content-Type': 'application/json'}});
  }

  return resolve(event);
};

export const handleError: HandleServerError = () => ({message: 'An error occurred. Please try again later.'});
