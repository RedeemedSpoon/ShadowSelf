import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {User} from '../types';

export default new Elysia({prefix: '/api'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(4);
    const auth = ['/'];

    if (auth.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not authorized to access this route');
    }
  })
  .get('/', () => 'Hello from the api');
