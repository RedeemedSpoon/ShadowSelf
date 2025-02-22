import type {PageServerLoad} from './$types';
import type {Identity, Option} from '$type';
import {fetchApi} from '$lib';

export const load: PageServerLoad = async () => {
  const remains = await fetchApi('/account/recovery-remaining', 'GET');
  const identities = (await fetchApi('/identity/', 'GET')) as Identity[];
  const searchKeywords: Option[] = [];

  if (!identities.length)
    return {
      recoveryRemaining: remains.message,
      searchKeywords: [],
      identities: [],
    };

  identities.forEach((identity: Identity) => {
    const concat = `${identity.name} ${identity.country} ${identity.location} ${identity.id} `;
    concat.concat(`${identity.email} ${identity.phone} ${identity.card} ${identity.accounts}`);
    searchKeywords.push({label: identity.id, value: concat.toLowerCase()});
  });

  return {
    recoveryRemaining: remains.message,
    searchKeywords,
    identities,
  };
};
