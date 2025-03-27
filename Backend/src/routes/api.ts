import {attempt, resizeImage} from '@utils/utils';
import {sql} from '@utils/connection';
import middleware from '@middleware';
import {Elysia, error} from 'elysia';

import card from './identity/card';
import phone from './identity/phone';
import email from './identity/email';
import account from './identity/account';
import information from './identity/information';

export default new Elysia({prefix: '/api'})
  .use(middleware)
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(4);
    const auth = ['/', '/identity', '/email', '/phone', '/card', '/account'];

    const isAuthorizedPath = auth.some((p) => {
      return relativePath === p || relativePath === `${p}/`;
    });

    if (isAuthorizedPath && !user) {
      return error(401, 'You are not authorized to access this route');
    }
  })
  .get('/', async ({user}) => {
    const result = await attempt(sql` SELECT * FROM users u JOIN identities i ON u.id = i.owner WHERE u.email = ${user!.email}`);
    if (!result.length) return error(400, 'User/Identity not found');

    const allIdentitiesPromises = result.map(async (identity) => {
      if (!identity.name) return {};
      const {id, picture, name, location, email, phone, card} = identity;

      const lowResPic = await resizeImage(picture);
      const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${id}`);
      const formattedLocation = location.slice(4).trim();
      const country = location.split(',')[0];

      return {id, picture: lowResPic, name, email, phone, card, country, location: formattedLocation, accounts: accounts?.length};
    });

    return await Promise.all(allIdentitiesPromises);
  })
  .use(card)
  .use(phone)
  .use(email)
  .use(account)
  .use(information);
