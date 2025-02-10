import {User, CreationProcess} from '../types';
import {allFakers} from '@faker-js/faker';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt, blobToBase64} from '../utils';
import {Elysia, t} from 'elysia';

const ethnicities = ['caucasian', 'black', 'hispanic', 'latino', 'arab', 'east asian', 'south asian'];
const locations = [
  {
    country: 'United States',
    code: 'US',
    city: 'Seattle',
    localization: 'en',
    ip: '91.240.75.212',
    map: 'https://osm.org/go/WIdEVZFE',
  },
  {
    country: 'France',
    code: 'FR',
    city: 'Paris',
    localization: 'fr',
    ip: '24.68.162.126',
    map: 'https://osm.org/go/0BOd2l~--',
  },
  {
    country: 'Spain',
    code: 'ES',
    city: 'Madrid',
    localization: 'es',
    ip: '153.869.12.56',
    map: 'https://osm.org/go/b_Njo_H-',
  },
  {
    country: 'South Korea',
    code: 'KR',
    city: 'Seoul',
    ip: '38.0.101.76',
    localization: 'ko',
    map: 'https://osm.org/go/b_M3ywz7V',
  },
];

export default new Elysia()
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .post('/creation-process', async ({headers, jwt, body}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;

    const user = (await jwt.verify(token)) as User;
    if (!user) return;

    const {id} = body as {id: string};
    const account = await attempt(sql`SELECT * FROM users WHERE email = ${user?.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${id}`);

    if (!identity.length) return;
    if (identity[0].owner !== account[0].id) return;
    if (identity[0].status !== 'inactive') return;

    //@ts-expect-error JWT only accept objects
    let cookie = await jwt.sign(id + process.env.SECRET_SAUCE);
    cookie = cookie.split('.')[2];
    return {cookie};
  })
  .ws('/ws-creation-process', {
    query: t.Object({id: t.String()}),
    async message(ws, message: CreationProcess) {
      const cookie = ws.data.cookie['creation-process'];
      if (!cookie) return ws.close(1014, 'You do not have permission to perform this action');

      const [validationCookie, ...cookieStore] = cookie.value?.split('&&') || [];
      const identityID = ws.data.query.id;

      //@ts-expect-error JWT only accept objects
      const validToken = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
      if (validToken.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');

      switch (message.kind) {
        case 'start': {
          ws.send({locations});
          break;
        }

        case 'locations': {
          const {code} = message;
          if (!['US', 'FR', 'ES', 'KR'].includes(code)) {
            ws.send({error: 'Invalid location code'});
            break;
          }

          const lang = locations.find((location) => location.code === code);
          const faker = allFakers[lang?.localization as keyof typeof allFakers];

          const sex = faker.person.sex() as 'male' | 'female';
          const name = faker.person.fullName({sex});
          const bio = faker.person.bio();

          const ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
          const date = faker.date.birthdate({mode: 'age', min: 18, max: 65});

          const ms_per_year = 1000 * 60 * 60 * 24 * 365.2425;
          const age = Math.floor((new Date().getTime() - date.getTime()) / ms_per_year);

          const prompt = `${ethnicity} ${sex} individual, aged ${age}, ${bio}, located in ${lang?.city}, ${lang?.country}`;
          const negativePrompt = 'overly idealized, unrealistic, flawless, artificial, exaggerated features, stereotypical appearance';

          const formData = new FormData();
          formData.append('prompt', prompt);
          formData.append('aspect_ratio', '1:1');
          formData.append('output_format', 'webp');
          formData.append('negative_prompt', negativePrompt);

          const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
            method: 'POST',
            body: formData,
            headers: {
              authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
              accept: 'image/*',
            },
          });

          const avatar = await blobToBase64(await response.blob());
          const identity = {avatar, name, bio, sex, date, ethnicity};

          cookie.set({value: cookie.value + `&&${code}`});
          ws.send({identity});
          break;
        }
      }
    },
  });
