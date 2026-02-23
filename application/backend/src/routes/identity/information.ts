import {debounceCache, sql} from '@utils/connection';
import {generateProfile} from '@utils/prompts';
import {attempt, error} from '@utils/utils';
import {allFakers} from '@faker-js/faker';
import middleware from '@middleware-api';
import locations from '@utils/locations';
import {checkAPI} from '@utils/checks';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/identity'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const {email_password, proxy_password, payment_intent, subscription_id, owner, status, ...pubInfo} = identity!;
    const {creation_date, proxy_server, wallet_keys, wallet_blob, wallet_funds, ...rest} = pubInfo;
    const reformattedData = {
      creationDate: creation_date,
      proxyServer: proxy_server,
      walletFunds: wallet_funds,
      walletKeys: wallet_keys,
      walletBlob: wallet_blob,
    };

    return {...rest, ...reformattedData};
  })
  .patch('/regenerate-picture/:id', async ({set, identity, body}) => {
    const fields = ['?sex', '?age', '?ethnicity', '?bio'];
    const data = {sex: identity!.sex, age: identity!.age, ethnicity: identity!.ethnicity, bio: identity!.bio};
    const {err, sex, age, ethnicity, bio} = await checkAPI({...data, ...body!}, fields);
    if (err) return error(set, 400, err);

    const REQUEST_TYPE = 'Profile Gen';
    const DEBOUNCE_DURATION = 60_000;

    if (debounceCache[identity!.id]?.find((i) => i.requestType === REQUEST_TYPE)) {
      return error(set, 429, 'Rate limit: Please wait a bit more');
    }

    if (!debounceCache[identity!.id]) debounceCache[identity!.id] = [];
    debounceCache[identity!.id].push({requestType: REQUEST_TYPE, data: null});

    setTimeout(() => {
      if (debounceCache[identity!.id])
        debounceCache[identity!.id] = debounceCache[identity!.id].filter((i) => i.requestType !== REQUEST_TYPE);
    }, DEBOUNCE_DURATION);

    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);
    const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
    return {picture};
  })
  .patch('/regenerate-name/:id', async ({set, identity, body}) => {
    const {err, sex} = await checkAPI({sex: identity!.sex, ...body!}, ['?sex']);
    if (err) return error(set, 400, err);

    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);
    const faker = allFakers[lang?.localization as keyof typeof allFakers];
    const name = faker.person.fullName({sex: sex as 'male' | 'female'});

    return {name};
  })
  .patch('/regenerate-bio/:id', async ({identity}) => {
    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);
    const faker = allFakers[lang?.localization as keyof typeof allFakers];
    const bio = faker.person.bio();

    return {bio};
  })
  .put('/update-information/:id', async ({set, identity, body}) => {
    const fields = ['?sex', '?ethnicity', '?age', '?name', '?bio', '?picture'];
    const data1 = {sex: identity!.sex, ethnicity: identity!.ethnicity, age: identity!.age};
    const data2 = {name: identity!.name, bio: identity!.bio, picture: identity!.picture};
    const {err, sex, ethnicity, age, name, bio, picture} = await checkAPI({...data1, ...data2, ...body!}, fields);
    if (err) return error(set, 400, err);

    await attempt(sql`UPDATE identities SET sex = ${sex!}, ethnicity = ${ethnicity!}, age = ${age!} WHERE id = ${identity!.id}`);
    await attempt(sql`UPDATE identities SET name = ${name!}, bio = ${bio!}, picture = ${picture!} WHERE id = ${identity!.id}`);

    return {sex, ethnicity, age, name, bio, picture};
  });
