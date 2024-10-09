import type {Actions} from './$types';
import {fetchApi} from '$lib';

export const actions = {
  default: async ({request}) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    return await fetchApi('/join', 'POST', {email});
  },
} satisfies Actions;
