import {User, CreationProcess} from '../types';
import {allFakers} from '@faker-js/faker';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {Elysia, t} from 'elysia';

const shapes = ['fit', 'curvy', 'slim', 'fat', 'muscular', 'chubby', 'obese'];
const ethnicities = [
  'caucasian',
  'black',
  'hispanic',
  'asian',
  'latino',
  'arab',
  'middle eastern',
  'east asian',
  'south asian',
  'indian',
];
const locations = [
  {
    code: 'US',
    country: 'United States',
    city: 'Seattle',
    ip: '91.240.75.212',
    map: 'https://osm.org/go/WIdEVZFE',
    localization: 'en',
  },
  {
    code: 'FR',
    country: 'France',
    city: 'Paris',
    ip: '24.68.162.1',
    map: 'https://osm.org/go/0BOd2l~--',
    localization: 'fr',
  },
  {
    code: 'ES',
    country: 'Spain',
    city: 'Madrid',
    ip: '153.869.12.56',
    map: 'https://osm.org/go/b_Njo_H-',
    localization: 'es',
  },
  {
    code: 'KR',
    country: 'South Korea',
    city: 'Seoul',
    ip: '38.0.101.76',
    map: 'https://osm.org/go/b_M3ywz7V',
    localization: 'ko',
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
          const shape = shapes[Math.floor(Math.random() * shapes.length)];
          const date = faker.date.birthdate({mode: 'age', min: 18, max: 65});

          const identity = {
            avatar: '',
            name,
            bio,
            sex,
            date,
            shape,
            ethnicity,
          };

          cookie.set({value: cookie.value + `&&${code}`});
          ws.send({identity});
          break;
        }
      }
    },
  });
