import type {Actions, PageServerLoad} from './$types';
import {fetchApi} from '$lib';

export const load: PageServerLoad = () => {
  return {
    ids: ['welcome', 'product', 'services', 'usecases', 'features', 'pricing', 'solution', 'waitlist'],
    animations: [],
  };
};

export const actions = {
  default: async ({request}) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    return await fetchApi('/join', 'POST', {email});
  },
} satisfies Actions;
