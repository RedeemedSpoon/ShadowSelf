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
        map: 'https://osm.org/go/WIdEVZFE',
      },
      {
        country: 'Netherlands',
        code: 'NL',
        city: 'Amsterdam',
        localization: 'nl',
        ip: '153.869.12.56',
        map: 'https://osm.org/go/0E4~sdq--',
      },
      {
        country: 'Brazil',
        code: 'BR',
        city: 'São Paulo',
        localization: 'pt_BR',
        ip: '24.68.162.126',
        map: 'https://osm.org/go/M~yzo4',
      },
      {
        country: 'Japan',
        code: 'JP',
        city: 'Tokyo',
        ip: '38.0.101.76',
        localization: 'ja',
        map: 'https://osm.org/go/7Q52DZ',
      },
    ];
  });
