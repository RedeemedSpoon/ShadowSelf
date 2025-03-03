import {User, WebsocketRequest, Location} from '../types';
import {attempt, blobToBase64, request} from '../utils';
import {allFakers} from '@faker-js/faker';
import {checkAPI} from '../checks';
import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
import {Elysia} from 'elysia';

export default new Elysia().use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string})).ws('/ws/api/:id', {
  async message(ws, message: WebsocketRequest | 'ping') {
    if (message === 'ping') return ws.send('pong');

    const cookie = ws.data.cookie['token'];
    if (!cookie) return ws.close(1014, 'You are not logged in');

    const user = (await ws.data.jwt.verify(cookie.value)) as User;
    if (!user?.email) return ws.close(1014, 'You do not logged in');

    const params = ws.data.params.id;
    const identity = (await attempt(sql`SELECT * FROM identities WHERE id = ${params}`))[0];
    if (!identity) return ws.close(1014, 'Identity not found. Please try again');

    const id = (await attempt(sql`SELECT id FROM users WHERE email = ${user!.email}`))[0].id;
    if (id !== identity.owner) return ws.close(1014, 'You do not authorize to perform this action');

    switch (message.type) {
      case 'regenerate-picture': {
        const mes = {sex: identity.sex, age: identity.age, ethnicity: identity.ethnicity, ...message};
        const {error, sex, age, ethnicity} = await checkAPI(mes);
        if (error) return ws.send({error});

        const locations = (await request('/extension-api', 'GET')) as Location[];
        const lang = locations.find((location) => location.code === identity.location.split(',')[0]);

        const prompt = `${ethnicity} ${sex} individual, aged ${age}, showcasing authentic and natural features, with realistic skin texture, facial expression, and posture. The person should reflect genuine human traits, with subtle imperfections and a non-stereotypical appearance, exuding a sense of warmth, personality, and approachability. They are in an urban environment, with a bustling cityscape in ${lang?.city}, ${lang?.country} in the background, capturing the vibrant, everyday life of the city. The setting should feel natural and immersive, with elements such as streets, buildings, and people in the background, adding to the realism.`;

        const negativePrompt =
          'hyper-realistic, polished skin, exaggerated features, overly symmetrical, robotic or artificial facial expressions, cartoonish, stylized, or unrealistic traits, backgrounds that are not realistic city environments, overly simple or bland settings';

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('aspect_ratio', '1:1');
        formData.append('output_format', 'png');
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
        ws.send({type: 'regenerate-picture', picture});
        break;
      }

      case 'regenerate-name': {
        const mes = {sex: identity.sex, ...message};
        const {error, sex} = await checkAPI(mes);
        if (error) return ws.send({error});

        const locations = (await request('/extension-api', 'GET')) as Location[];
        const lang = locations.find((location) => location.code === identity.location.split(',')[0]);

        const faker = allFakers[lang?.localization as keyof typeof allFakers];
        const name = faker.person.fullName({sex: sex as 'male' | 'female'});

        ws.send({type: 'regenerate-name', name});
        break;
      }

      case 'regenerate-bio': {
        const locations = (await request('/extension-api', 'GET')) as Location[];
        const lang = locations.find((location) => location.code === identity.location.split(',')[0]);

        const faker = allFakers[lang?.localization as keyof typeof allFakers];
        const bio = faker.person.bio();

        ws.send({type: 'regenerate-bio', bio});
        break;
      }

      case 'update-information':
        break;

      default:
        ws.send({error: 'Invalid action. Please read the documentation carefully'});
        break;
    }
  },
});
