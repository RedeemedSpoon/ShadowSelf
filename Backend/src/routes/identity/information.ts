import middleware from '@middleware-api';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/identity'}).use(middleware).get('/:id', async ({identity}) => {
  const {picture, name, bio, age, sex, ethnicity} = identity!;
  const {id, creation_date, proxy_server, user_agent, location, email, phone, card} = identity!;
  return {id, creation_date, proxy_server, user_agent, picture, name, bio, age, sex, ethnicity, location, email, phone, card};
});
