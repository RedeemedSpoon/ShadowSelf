import type {PageServerLoad} from './$types';
import type {Identity, Option} from '$type';
import {fetchBackend} from '$lib';

export const load: PageServerLoad = async () => {
  const remains = await fetchBackend('/account/recovery-remaining', 'GET');
  const response = await fetchBackend('/api', 'GET');
  if (response.type === 'alert')
    return {
      recoveryRemaining: remains.message,
      searchKeywords: [],
      identities: [],
    };

  const searchKeywords: Option[] = [];
  const identities = Object.values(response) as Identity[];
  identities.pop();

  identities.forEach((identity) => {
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
