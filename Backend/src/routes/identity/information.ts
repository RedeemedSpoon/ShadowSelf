import {generateProfile} from '@utils/prompts';
import {request, attempt} from '@utils/utils';
import {allFakers} from '@faker-js/faker';
import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {sql} from '@utils/connection';
import {Elysia, error} from 'elysia';
import {Location} from '@types';

export default new Elysia({prefix: '/identity'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const {picture, name, bio, age, sex, ethnicity} = identity!;
    const {id, creation_date, proxy_server, user_agent, location, email, phone, card} = identity!;
    return {id, creation_date, proxy_server, user_agent, picture, name, bio, age, sex, ethnicity, location, email, phone, card};
  })
  .post('/regenerate-picture/:id', async ({identity, body}) => {
    const fields = ['?sex', '?age', '?ethnicity', '?bio'];
    const data = {sex: identity!.sex, age: identity!.age, ethnicity: identity!.ethnicity, bio: identity!.bio};
    const {err, sex, age, ethnicity, bio} = await checkAPI({...data, ...body!}, fields);
    if (err) return error(400, error);

    const locations = (await request('/extension-api', 'GET')) as Location[];
    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);

    const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
    return {picture};
  })
  .post('/regenerate-name/:id', async ({identity, body}) => {
    const {err, sex} = await checkAPI({sex: identity!.sex, ...body!}, ['?sex']);
    if (err) return error(400, err);

    const locations = (await request('/extension-api', 'GET')) as Location[];
    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);

    const faker = allFakers[lang?.localization as keyof typeof allFakers];
    const name = faker.person.fullName({sex: sex as 'male' | 'female'});

    return {name};
  })
  .post('/regenerate-bio/:id', async ({identity}) => {
    const locations = (await request('/extension-api', 'GET')) as Location[];
    const lang = locations.find((location) => location.code === identity!.location.split(',')[0]);

    const faker = allFakers[lang?.localization as keyof typeof allFakers];
    const bio = faker.person.bio();

    return {bio};
  })
  .post('/update-information/:id', async ({identity, body}) => {
    const fields = ['?sex', '?ethnicity', '?age', '?name', '?bio', '?picture'];
    const data1 = {sex: identity!.sex, ethnicity: identity!.ethnicity, age: identity!.age};
    const data2 = {name: identity!.name, bio: identity!.bio, picture: identity!.picture};
    const {err, sex, ethnicity, age, name, bio, picture} = await checkAPI({...data1, ...data2, ...body!}, fields);
    if (err) return error(400, err);

    await attempt(sql`UPDATE identities SET sex = ${sex!}, ethnicity = ${ethnicity!}, age = ${age!} WHERE id = ${identity!.id}`);
    await attempt(sql`UPDATE identities SET name = ${name!}, bio = ${bio!}, picture = ${picture!} WHERE id = ${identity!.id}`);

    return {sex, ethnicity, age, name, bio, picture};
  });
