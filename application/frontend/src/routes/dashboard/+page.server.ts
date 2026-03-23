import type {PageServerLoad} from './$types';
import {fetchBackend} from '$utils/webfetch';
import type {Identity, Option} from '$type';

export const load: PageServerLoad = async ({cookies}) => {
  const remains = await fetchBackend('/account/recovery-remaining', 'GET', undefined, cookies.get('token'));
  const response = await fetchBackend('/api', 'GET', undefined, cookies.get('token'));

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
    if (!identity.name) return;
    const concat = `${identity.name} ${identity.country} ${identity.location} ${identity.id} `;
    concat.concat(`${identity.email} ${identity.phone} ${identity.accounts} ${identity.walletFunds}`);
    searchKeywords.push({label: identity.id, value: concat.toLowerCase()});
  });

  return {
    recoveryRemaining: remains.message,
    searchKeywords,
    identities,
  };
};
