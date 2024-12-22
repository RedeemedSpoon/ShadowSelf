import {Elysia, error} from 'elysia';
import {User} from '../types';
import {jwt} from '@elysiajs/jwt';

export default new Elysia({prefix: '/billing'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(9);
    const mustLog = ['/', '/portal', '/webhook'];

    if (mustLog.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not logged in');
    }
  });
