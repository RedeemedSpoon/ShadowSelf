import {redirect} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = ({url}) => {
  if (url.search) {
    redirect(308, '/extension');
  }

  return {};
};
