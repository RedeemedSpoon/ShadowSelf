import type {Actions, PageServerLoad} from './$types';
import {fetchBackend} from '$fetch';
import type {Option} from '$type';

export const load: PageServerLoad = () => {
  return {
    contactOptions: [
      {
        value: 'question',
        label: 'I have a question or a concern',
      },
      {
        value: 'feedback',
        label: 'I have a feedback or a suggestion',
      },
      {
        value: 'collaboration',
        label: 'I want to collaborate with you',
      },
      {
        value: 'bug',
        label: 'I found a bug or an issue',
      },
      {
        value: 'help',
        label: 'I need severe help',
      },
      {
        value: 'other',
        label: 'Other',
      },
    ] satisfies Option[],
  };
};

export const actions: Actions = {
  default: async ({request}) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const subject = data.get('subject') as string;
    const message = data.get('message') as string;
    const category = data.get('category') as string;

    return await fetchBackend('/contact', 'POST', {category, email, subject, message});
  },
};
