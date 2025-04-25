import {attempt, resizeImage} from '@utils/utils';
import {sql} from '@utils/connection';
import {Elysia, error} from 'elysia';
import middleware from '@middleware';

export default new Elysia()
  .use(middleware)
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(14);
    const auth = ['/locations', '/extension-api'];

    if (auth.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not authorized to access this route');
    }
  })
  .get('/locations', () => {
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
  })
  .group('/extension-api', (app) =>
    app.get('/', async ({user}) => {
      const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
      if (!result.length) return error(400, 'User not found');

      const {username, id} = result[0];
      const allIdentities = await attempt(sql`SELECT * FROM identities WHERE owner = ${id}`);
      if (!allIdentities.length) return {username, identities: []};

      const identitiesPromises = allIdentities.map(async (identity) => {
        if (!identity.name) return {id: identity.id};

        const {id, picture, name, location, proxy_server, user_agent} = identity;
        return {id, picture: await resizeImage(picture), name, location, proxyServer: proxy_server, userAgent: user_agent};
      });

      return {username, identities: await Promise.all(identitiesPromises)};
    }),
  );
