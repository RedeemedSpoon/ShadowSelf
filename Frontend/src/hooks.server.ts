import type {Handle} from '@sveltejs/kit';

export const handle: Handle = async ({event, resolve}) => {
  if (event.url.pathname.startsWith('/api/extension')) {
    const response = await fetch(`http://localhost:3000${event.url.pathname}`, event.request)
      .then((res) => res.json())
      .catch((error) => ({message: error.message, type: 'alert'}));

    return new Response(JSON.stringify(response), {headers: {'Content-Type': 'application/json'}});
  }

  return resolve(event);
};
