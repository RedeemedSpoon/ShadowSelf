import type {PageServerLoad} from './$types';

export const load: PageServerLoad = () => {
  return {
    settings: ['Basic Credentials', 'Two Factor Authentication', 'API Key', 'Billing Information', 'Danger Zone'],
  };
};
