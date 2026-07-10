import type {PageServerLoad} from './$types';
import {fetchBackend} from '$utils/webfetch';
import type {Identity, Option} from '$type';

export const load: PageServerLoad = async ({cookies}) => {
  const remains = await fetchBackend('/account/recovery-remaining', 'GET', undefined, cookies.get('token'));
  const response = await fetchBackend('/api', 'GET', undefined, cookies.get('token'));

  if (response.type === 'alert' || !Array.isArray(response))
    return {
      recoveryRemaining: remains.message,
      searchKeywords: [],
      identities: [],
    };

  const searchKeywords: Option[] = [];
  const identities = response as Identity[];

  identities.forEach((identity) => {
    if (!identity.name) return;
    const concat = `${identity.name} ${identity.country} ${identity.location} ${identity.id} `;
    const keywords = concat + `${identity.email} ${identity.phone} ${identity.accounts} ${identity.walletFunds}`;
    searchKeywords.push({label: identity.id, value: keywords.toLowerCase()});
  });

  return {
    recoveryRemaining: remains.message,
    searchKeywords,
    identities,
  };
};
