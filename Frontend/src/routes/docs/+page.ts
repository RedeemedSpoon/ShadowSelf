import type {PageLoad} from './$types';
import type {Docs} from '$type';

export const load: PageLoad = () => {
  return {docs: {} as Docs};
};
