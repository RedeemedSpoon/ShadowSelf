import type {PageServerLoad} from './$types';
import {backend} from '$lib/backend.server';
import type {Identity} from '$type';

export const load: PageServerLoad = async ({cookies}) => {
  const token = cookies.get('token');
  const [identities, recovery] = await Promise.all([
    backend<{identities: Identity[]}>('/identities', 'GET', undefined, token),
    backend<{recoveryRemaining: number}>('/auth/recovery-remaining', 'GET', undefined, token),
  ]);

  return {
    identities: identities.ok ? identities.data.identities : [],
    loadError: identities.ok ? '' : identities.error,
    recoveryRemaining: recovery.ok ? recovery.data.recoveryRemaining : null,
  };
};
