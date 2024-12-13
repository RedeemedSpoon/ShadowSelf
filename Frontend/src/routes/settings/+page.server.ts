import type {PageServerLoad, Actions} from './$types';
import type {Settings} from '$type';
import {fetchApi} from '$lib';

export const load: PageServerLoad = async () => {
  const response = await fetchApi('/settings/', 'GET');
  return {settings: response};
};

export const actions: Actions = {
  username: async ({request}) => {},
  password: async ({request}) => {},
  otp: async ({request}) => {},
  recovery: async ({request}) => {},
  toggleApi: async ({request}) => {},
  api: async ({request}) => {},
  billing: async ({request}) => {},
  deleteBilling: async ({request}) => {},
  session: async ({request}) => {},
  delete: async ({request}) => {},
};
