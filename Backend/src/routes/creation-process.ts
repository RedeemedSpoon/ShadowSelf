import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {Elysia, t} from 'elysia';
import {User} from '../types';

export default new Elysia()
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .post('/creation-process', async ({headers, jwt, body}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;

    const user = (await jwt.verify(token)) as User;
    if (!user) return;

    const {id} = body as {id: string};
    const account = await attempt(sql`SELECT * FROM users WHERE email = ${user?.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${id}`);

    if (!identity.length) return;
    if (identity[0].owner !== account[0].id) return;
    if (identity[0].status !== 'inactive') return;

    //@ts-expect-error JWT only accept objects
    const cookie = await jwt.sign(id + process.env.SECRET_SAUCE);
    return {cookie: cookie.split('.')[2]};
  })
  .ws('/ws-creation-process', {
    query: t.Object({id: t.String()}),
    async message(ws, message) {
      const validationCookie = ws.data.cookie['creation-process']?.value;
      if (!validationCookie) return ws.close(1014, 'You do not have permission to perform this action');
      const identityID = ws.data.query.id;

      //@ts-expect-error JWT only accept objects
      const cookie = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
      if (cookie.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');

      console.log(message);
    },
  });
