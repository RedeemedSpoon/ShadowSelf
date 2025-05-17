import {generateProfile} from '@utils/prompts';
import {allFakers} from '@faker-js/faker';
import middleware from '@middleware-api';
import locations from '@utils/locations';
import {checkAPI} from '@utils/checks';
import {sql} from '@utils/connection';
import {Elysia, error} from 'elysia';

export default new Elysia({prefix: '/identity'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const {picture, name, bio, age, sex, ethnicity} = identity!;
    const {id, creation_date, proxy_server, location, email, phone, card} = identity!;
    return {id, creation_date, proxy_server, picture, name, bio, age, sex, ethnicity, location, email, phone, card};
  })
  .patch('/regenerate-picture/:id', async ({identity, body}) => {
    const fields = ['?sex', '?age', '?ethnicity', '?bio'];
    const data = {sex: identity!.sex, age: identity!.age, ethnicity: identity!.ethnicity, bio: identity!.bio};
    const {err, sex, age, ethnicity, bio} = await checkAPI({...data, ...body!}, fields);
    if (err) return error(400, error);

    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);
    const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
    return {picture};
  })
  .patch('/regenerate-name/:id', async ({identity, body}) => {
    const {err, sex} = await checkAPI({sex: identity!.sex, ...body!}, ['?sex']);
    if (err) return error(400, err);

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
  .put('/update-information/:id', async ({identity, body}) => {
    const fields = ['?sex', '?ethnicity', '?age', '?name', '?bio', '?picture'];
    const data1 = {sex: identity!.sex, ethnicity: identity!.ethnicity, age: identity!.age};
    const data2 = {name: identity!.name, bio: identity!.bio, picture: identity!.picture};
    const {err, sex, ethnicity, age, name, bio, picture} = await checkAPI({...data1, ...data2, ...body!}, fields);
    if (err) return error(400, err);

    await attempt(sql`UPDATE identities SET sex = ${sex!}, ethnicity = ${ethnicity!}, age = ${age!} WHERE id = ${identity!.id}`);
    await attempt(sql`UPDATE identities SET name = ${name!}, bio = ${bio!}, picture = ${picture!} WHERE id = ${identity!.id}`);

    return {sex, ethnicity, age, name, bio, picture};
  });
