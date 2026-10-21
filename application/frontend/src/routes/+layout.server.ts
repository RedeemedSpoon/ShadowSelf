import type {LayoutServerLoad} from './$types';
import {backend} from '$lib/backend.server';
import type {Identity} from '$type';

export const load: LayoutServerLoad = async ({locals, cookies, url, depends}) => {
  depends('app:identities');

  const consoleRoute = ['/dashboard', '/settings', '/identity', '/purchase', '/create'].some(
    (route) => url.pathname === route || url.pathname.startsWith(`${route}/`),
  );

  if (!locals.user || !consoleRoute) {
    return {user: locals.user, identities: [] as Identity[], identitiesError: ''};
  }

  const result = await backend<{identities: Identity[]}>('/identities', 'GET', undefined, cookies.get('token'));

  return {
    user: locals.user,
    identities: result.ok ? result.data.identities : [],
    identitiesError: result.ok ? '' : result.error,
  };
};
