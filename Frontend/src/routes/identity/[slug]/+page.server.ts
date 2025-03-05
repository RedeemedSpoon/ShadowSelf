import type {PageServerLoad} from './$types';
import type {FullIdentity} from '$type';
import {fetchBackend} from '$lib';
import {get} from 'svelte/store';
import {token} from '$store';

export const load: PageServerLoad = async ({params}) => {
  const response = (await fetchBackend('/api/identity/' + params.slug)) as FullIdentity;
  if (!response.id) return {slug: params.slug, identity: null};
  return {token: get(token), slug: params.slug, identity: response};
};
