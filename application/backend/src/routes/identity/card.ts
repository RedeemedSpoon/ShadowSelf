import middleware from '@middleware-api';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/card'}).use(middleware).get('/:id', async ({identity}) => {
  console.log(identity!.card);
});
