import middlewareBase from '@middlewares/middleware-base';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/crypto'})
  .use(middlewareBase)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(15);
    const mustLogIn = ['/new-crypto-invoice'];

    if (mustLogIn.some((p) => relativePath === p || relativePath === p + '/') && !user) {
      return error(set, 401, 'You are not logged in');
    }
  })
  .get('/new-invoice', async ({}) => {})
  .ws('/check-invoice/:id', {
    async open(ws) {},
    async close(ws) {},
    async message(ws, message) {},
  });
