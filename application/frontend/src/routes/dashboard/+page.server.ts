import type {PageServerLoad} from './$types';
import {backend} from '$lib/backend.server';

export const load: PageServerLoad = async ({cookies, parent}) => {
  const token = cookies.get('token');
  const [identities, recovery] = await Promise.all([
    parent(),
    backend<{recoveryRemaining: number}>('/auth/recovery-remaining', 'GET', undefined, token),
  ]);

  return {
    identities: identities.identities,
    loadError: identities.identitiesError,
    recoveryRemaining: recovery.ok ? recovery.data.recoveryRemaining : null,
  };
};
