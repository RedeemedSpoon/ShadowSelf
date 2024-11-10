import type {PageServerLoad} from './$types';

export const load: PageServerLoad = () => {
  return {
    options: [
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
        value: 'refund',
        label: 'I want a to get a refund',
      },
      {
        value: 'other',
        label: 'Other',
      },
    ],
  };
};
