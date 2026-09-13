import middlewareApi from '@middlewares/middleware-api';
import {generateProfile} from '@utils/prompts';
import {allFakers} from '@faker-js/faker';
import {LOCATIONS} from '@core/constants';
import {checkAPI} from '@utils/checks';
import {throttle} from '@core/states';
import {error} from '@utils/utils';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/identity'})
  .use(middlewareApi)
  .get('/:id', ({identity}) => ({
    id: identity!.id,
    plan: identity!.plan,
    location: identity!.location,
    picture: identity!.picture,
    name: identity!.name,
    bio: identity!.bio,
    age: identity!.age,
    sex: identity!.sex,
    ethnicity: identity!.ethnicity,
    email: identity!.email,
    phone: identity!.phone,
    vaultRevision: identity!.vault_revision,
    creationDate: identity!.creation_date,
    proxyServer: identity!.proxy_server,
    walletFunds: identity!.wallet_funds,
    walletKeys: identity!.wallet_keys,
    walletBlob: identity!.wallet_blob,
    paymentMethod: identity!.crypto_invoice ? 'crypto' : 'fiat',
  }))
  .patch(
    '/regenerate-picture/:id',
    async ({set, identity, body}) => {
      const fields = ['?sex', '?age', '?ethnicity', '?bio'];
      const data = {sex: identity!.sex, age: identity!.age, ethnicity: identity!.ethnicity, bio: identity!.bio};
      const input = await checkAPI(body === undefined ? {} : body, fields);
      if (input.err) return error(set, 400, input.err);
      const {sex, age, ethnicity, bio} = {...data, ...input};

      const lang = LOCATIONS.find((location) => location.code === identity!.location.split(',')[0]);
      const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
      return {picture};
    },
    throttle('Regenerate Picture', 30_000),
  )
  .patch('/regenerate-name/:id', async ({set, identity, body}) => {
    const input = await checkAPI(body === undefined ? {} : body, ['?sex']);
    if (input.err) return error(set, 400, input.err);
    const sex = input.sex ?? identity!.sex;

    const lang = LOCATIONS.find((location) => location.code === identity!.location.split(',')[0]);
    const faker = allFakers[lang?.localization as keyof typeof allFakers];
    const name = faker.person.fullName({sex: sex as 'male' | 'female'});

    return {name};
  })
  .patch('/regenerate-bio/:id', async ({identity}) => {
    const lang = LOCATIONS.find((location) => location.code === identity!.location.split(',')[0]);
    const faker = allFakers[lang?.localization as keyof typeof allFakers];
    const bio = faker.person.bio();

    return {bio};
  })
  .put('/update-information/:id', async ({set, identity, body}) => {
    const fields = ['?sex', '?ethnicity', '?age', '?name', '?bio', '?picture'];
    const input = await checkAPI(body, fields);
    if (input.err) return error(set, 400, input.err);
    const {sex, ethnicity, age, name, bio, picture} = {...identity!, ...input};

    await sql`UPDATE identities SET sex = ${sex}, ethnicity = ${ethnicity}, age = ${age},
      name = ${name}, bio = ${bio}, picture = ${picture} WHERE id = ${identity!.id}`;

    return {sex, ethnicity, age, name, bio, picture};
  });
