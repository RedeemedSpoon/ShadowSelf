import type {PageServerLoad} from './$types';
import type {FullIdentity} from '$type';
import {fetchApi} from '$lib';

export const load: PageServerLoad = async ({params}) => {
  const response = (await fetchApi('/identity/', 'POST', {id: params.slug})) as FullIdentity;
  if (!response.id) return {slug: params.slug, identity: null};
  return {slug: params.slug, identity: response};
};
