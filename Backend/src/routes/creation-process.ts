import {User, CreationProcess} from '../types';
import {attempt, blobToBase64} from '../utils';
import {allFakers} from '@faker-js/faker';
import {checkIdentity} from '../checks';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
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

export default new Elysia({websocket: {idleTimeout: 300}})
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
    async message(ws, message: CreationProcess | 'ping') {
      if (message === 'ping') return ws.send('pong');

      const cookie = ws.data.cookie['creation-process'];
      if (!cookie) return ws.close(1014, 'You do not have permission to perform this action');

      const [validationCookie, ...cookieStore] = cookie.value?.split('&&') || [];
      const identityID = ws.data.query.id;

      //@ts-expect-error JWT only accept objects
      const validToken = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
      if (validToken.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');

      switch (message.kind) {
        case 'locations': {
          ws.send({locations});
          break;
        }

        case 'identities': {
          if (message.code) {
            const {code, error} = await checkIdentity('code', message);
            if (error) return ws.send({error});

            cookie.set({value: cookie.value + `&&${code}`});
          }

          const lang = locations.find((location) => location.code === (cookieStore[0] || message.code));
          let {name, age, ethnicity, bio, sex, error} = (await checkIdentity('identity', message.regenerate)) || {};
          if (error) return ws.send({error});

          if (!message.regenerate) {
            const faker = allFakers[lang?.localization as keyof typeof allFakers];

            if (message.repeat) {
              if (message.repeat.name) {
                name = faker.person.fullName({sex: message.repeat.sex});
                ws.send({repeat: {name}});
              }
              if (message.repeat.bio) {
                bio = faker.person.bio();
                ws.send({repeat: {bio}});
              }
              break;
            }

            sex = Math.random() > 0.5 ? 'male' : 'female';
            name = faker.person.fullName({sex});
            bio = faker.person.bio();

            ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
            age = Math.floor(Math.random() * 42) + 18;
            error = undefined;
          }

          const prompt = `${ethnicity} ${sex} individual, aged ${age}, showcasing authentic and natural features, with realistic skin texture, facial expression, and posture. The person should reflect genuine human traits, with subtle imperfections and a non-stereotypical appearance, must be located in ${lang?.city}, ${lang?.country}, exuding a sense of warmth, personality, and approachability.`;

          const negativePrompt =
            'hyper-realistic, polished, exaggerated features, overly symmetrical, robotic or artificial facial expressions, cartoonish, stylized, or unrealistic traits';

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

          const picture = await blobToBase64(await response.blob());
          const identity = {picture, name, bio, sex, age, ethnicity};

          ws.send({identity});
          break;
        }

        case 'email': {
          const {picture, name, bio, sex, age, ethnicity, error} = await checkIdentity('identity', message.identity);
          if (error) return ws.send({error});

          const cookieString = `&&${picture}&&${name}&&${bio}&&${age}&&${sex}&&${ethnicity}`;
          cookie.set({value: cookie.value + cookieString});

          const sanitizedEmail = name!.trim().toLowerCase();
          const emailUsername = sanitizedEmail.replace(/[^\p{L}\p{N}]/gu, '');
          ws.send({email: emailUsername});
          break;
        }

        case 'phone': {
          const {email, error} = await checkIdentity('email', message);
          if (error) return ws.send({error});

          cookie.set({value: cookie.value + `&&${email?.trim().toLowerCase()}`});

          ws.send({phone: ['1234567890']});
          break;
        }

        case 'card': {
          ws.send({card: '4242 4242 4242 4242'});
          break;
        }

        case 'extension': {
          ws.send({_: null});
          break;
        }

        case 'sync': {
          ws.send({sync: '123456789'});
          break;
        }

        case 'finish': {
          const [location, picture, name, bio, age, sex, ethnicity, email, phone, card] = cookieStore;
          console.log({location, picture, name, bio, age, sex, ethnicity, email, phone, card});

          cookie.remove();
          ws.send({finish: true});
          break;
        }
      }
    },
  });
