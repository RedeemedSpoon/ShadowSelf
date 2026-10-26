import {env} from '$env/dynamic/private';
import type {LayoutServerLoad} from './$types';
import {backend} from '$lib/backend.server';
import type {Identity} from '$type';

export const load: LayoutServerLoad = async ({locals, cookies, url, depends}) => {
  depends('app:identities');

  const billingEnabled = env.ENABLE_BILLING === 'true';

  const consoleRoute = ['/dashboard', '/settings', '/identity', '/purchase', '/create'].some(
    (route) => url.pathname === route || url.pathname.startsWith(`${route}/`),
  );

  if (!locals.user || !consoleRoute) {
    return {user: locals.user, identities: [] as Identity[], identitiesError: '', billingEnabled};
  }

  const result = await backend<{identities: Identity[]}>('/identities', 'GET', undefined, cookies.get('token'));

  return {
    user: locals.user,
    billingEnabled,
    identities: result.ok ? result.data.identities : [],
    identitiesError: result.ok ? '' : result.error,
  };
};
