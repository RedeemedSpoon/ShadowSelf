import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {User} from '../types';

export default new Elysia({prefix: '/extension-api'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(14);
    const auth = ['/'];

    if (auth.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not authorized to access this route');
    }
  })
  .get('/', () => {
    return [
      {
        country: 'United States',
        code: 'US',
        city: 'Seattle',
        localization: 'en',
        ip: '91.240.75.212',
        map: 'https://osm.org/go/WIXvEZw-',
      },
      {
        country: 'United Kingdom',
        code: 'GB',
        city: 'London',
        localization: 'en_GB',
        ip: '153.869.12.56',
        map: 'https://osm.org/go/euunRP',
      },
      {
        country: 'Canada',
        code: 'CA',
        city: 'Toronto',
        localization: 'en_CA',
        ip: '24.68.162.126',
        map: 'https://osm.org/go/ZX6E86v-',
      },
      {
        country: 'Sweden',
        code: 'SE',
        city: 'Stockholm',
        ip: '38.0.101.76',
        localization: 'sv',
        map: 'https://osm.org/go/0bCz19',
      },
    ];
  });
