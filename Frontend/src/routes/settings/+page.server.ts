import type {PageServerLoad} from './$types';
import type {Settings} from '$type';

export const load: PageServerLoad = () => {
  return {
    userSettings: {
      has2FA: true,
      hasApiAccess: true,
      recoveryCodes: [458962137, 856239147, 125896347],
      apiKey: 'hfzjfzzefzh',
      billing: 'hfezehfezjz',
    } satisfies Settings,
  };
};
