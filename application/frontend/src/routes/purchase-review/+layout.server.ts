import {env} from '$env/dynamic/private';
import {error} from '@sveltejs/kit';
import type {LayoutServerLoad} from './$types';

export const load: LayoutServerLoad = ({setHeaders}) => {
  if (env.PURCHASE_REVIEW !== 'true') {
    error(404, 'Not found');
  }

  setHeaders({'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow'});

  return {};
};
