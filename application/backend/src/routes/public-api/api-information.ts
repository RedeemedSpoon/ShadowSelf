import middlewareApi from '@middlewares/middleware-api';
import {identityCryptoRefund} from '@core/crypto-refunds';
import {generateProfile} from '@utils/prompts';
import {faker} from '@faker-js/faker';
import {checkAPI} from '@utils/checks';
import {throttle} from '@core/states';
import {error} from '@utils/utils';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/api/identities'})
  .use(middlewareApi)
  .get('/:id', async ({identity, user}) => {
    const refund = await identityCryptoRefund(identity!.id, user!.accountID);

    return {
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
      status: identity!.status,
      walletKeys: identity!.wallet_keys,
      walletBlob: identity!.wallet_blob,
      paymentMethod: identity!.crypto_invoice ? 'crypto' : 'fiat',
      cryptoRefund: refund ? {usdAmount: refund.usd_amount} : null,
    };
  })
  .post(
    '/:id/profile/picture',
    async ({set, identity, body}) => {
      const fields = ['?sex', '?age', '?ethnicity', '?bio'];
      const data = {sex: identity!.sex, age: identity!.age, ethnicity: identity!.ethnicity, bio: identity!.bio};
      const input = await checkAPI(body === undefined ? {} : body, fields);

      if (input.err) {
        return error(set, 400, input.err);
      }

      const {sex, age, ethnicity, bio} = {...data, ...input};

      const picture = await generateProfile(identity!.location, age!, sex!, ethnicity!, bio!);

      await sql`UPDATE identities SET picture = ${picture} WHERE id = ${identity!.id} AND status = 'active'`;

      return {picture};
    },
    throttle('Regenerate Picture', 30_000),
  )
  .post('/:id/profile/name', async ({set, identity, body}) => {
    const input = await checkAPI(body === undefined ? {} : body, ['?sex']);

    if (input.err) {
      return error(set, 400, input.err);
    }

    const sex = input.sex ?? identity!.sex;

    const name = faker.person.fullName({sex: sex as 'male' | 'female'}).slice(0, 30);

    await sql`UPDATE identities SET name = ${name} WHERE id = ${identity!.id} AND status = 'active'`;

    return {name};
  })
  .post('/:id/profile/bio', async ({identity}) => {
    const bio = faker.person.bio().slice(0, 126);

    await sql`UPDATE identities SET bio = ${bio} WHERE id = ${identity!.id} AND status = 'active'`;

    return {bio};
  })
  .patch('/:id/profile', async ({set, identity, body}) => {
    const fields = ['?sex', '?ethnicity', '?age', '?name', '?bio', '?picture'];
    const input = await checkAPI(body, fields);

    if (input.err) {
      return error(set, 400, input.err);
    }

    const {sex, ethnicity, age, name, bio, picture} = {...identity!, ...input};

    await sql`UPDATE identities SET sex = ${sex}, ethnicity = ${ethnicity}, age = ${age},
      name = ${name}, bio = ${bio}, picture = ${picture} WHERE id = ${identity!.id}`;

    return {sex, ethnicity, age, name, bio, picture};
  });
