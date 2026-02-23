import type {PageServerLoad} from './$types';
import type {Identity, Option} from '$type';
import {fetchBackend} from '$fetch';

export const load: PageServerLoad = async ({parent}) => {
  const otherObjects = await parent();

  const remains = await fetchBackend('/account/recovery-remaining', 'GET');
  const response = await fetchBackend('/api', 'GET');

  if (response.type === 'alert')
    return {
      ...otherObjects,
      recoveryRemaining: remains.message,
      searchKeywords: [],
      identities: [],
    };

  const searchKeywords: Option[] = [];
  const identities = Object.values(response) as Identity[];

  identities.pop();
  identities.forEach((identity) => {
    if (!identity.name) return;
    const concat = `${identity.name} ${identity.country} ${identity.location} ${identity.id} `;
    concat.concat(`${identity.email} ${identity.phone} ${identity.accounts} ${identity.walletFunds}`);
    searchKeywords.push({label: identity.id, value: concat.toLowerCase()});
  });

  return {
    ...otherObjects,
    recoveryRemaining: remains.message,
    searchKeywords,
    identities,
  };
};
