import type {PageServerLoad} from './$types';
import type {AnimationSelector} from '$type';

export const load: PageServerLoad = () => {
  return {
    homepageIds: ['welcome', 'product', 'services', 'usecases', 'features', 'pricing', 'solution', 'waitlist'],
    animations: [
      {
        selector: '#welcome > *:not(#background)',
        type: 'bottom',
      },
      {
        selector: '#product > *',
        type: 'left',
      },
      {
        selector: '#main:last-child',
        type: 'right',
      },
      {
        selector: '#main:first-child',
        type: 'right',
        delay: 100,
      },
      {
        selector: '#services > div > div:first-child',
        type: 'right',
        delay: 200,
      },
      {
        selector: '#usecases h1',
        type: 'bottom',
      },
      {
        selector: '#account > div:first-child',
        type: 'left',
        delay: 200,
      },
      {
        selector: '#account > div:last-child',
        type: 'right',
        delay: 200,
      },
      {
        selector: '#features',
        type: 'bottom',
      },
      {
        selector: '#pricing > *',
        type: 'left',
      },
      {
        selector: '#solution > *',
        type: 'right',
      },
      {
        selector: '#waitlist > *:not(div)',
        type: 'bottom',
      },
    ] satisfies AnimationSelector[],
  };
};
