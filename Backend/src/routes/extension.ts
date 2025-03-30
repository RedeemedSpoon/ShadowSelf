import middleware from '@middleware';
import {Elysia, error} from 'elysia';

export default new Elysia({prefix: '/extension-api'})
  .use(middleware)
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
        country: 'Canada',
        code: 'CA',
        city: 'Toronto',
        localization: 'en_CA',
        ip: '24.68.162.126',
        map: 'https://osm.org/go/ZX6E86v-',
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
        country: 'Poland',
        code: 'PL',
        city: 'Warsaw',
        localization: 'pl',
        ip: '91.240.75.212',
        map: 'https://osm.org/go/0OyyYZ1-',
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
