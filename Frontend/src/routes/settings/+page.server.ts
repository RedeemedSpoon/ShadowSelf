import type {PageServerLoad, Actions} from './$types';
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

export const actions: Actions = {
  username: async ({request}) => {},
  password: async ({request}) => {},
  toggleOtp: async ({request}) => {},
  otp: async ({request}) => {},
  recovery: async ({request}) => {},
  toggleApi: async ({request}) => {},
  api: async ({request}) => {},
  billing: async ({request}) => {},
  deleteBilling: async ({request}) => {},
  session: async ({request}) => {},
  delete: async ({request}) => {},
};
