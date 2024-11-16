import type {LayoutServerLoad} from './$types';
import {fetchApi} from '$lib';
import {token} from '$store';

export const load: LayoutServerLoad = async ({cookies}) => {
  token.set(cookies.get('token') || '');
  const response = await fetchApi('/account');
  return {user: response.username || ''};
};
