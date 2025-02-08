import {User, CreationProcess} from '../types';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {Elysia, t} from 'elysia';

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
    async message(ws, message: CreationProcess) {
      const validationCookie = ws.data.cookie['creation-process']?.value;
      if (!validationCookie) return ws.close(1014, 'You do not have permission to perform this action');
      const identityID = ws.data.query.id;

      //@ts-expect-error JWT only accept objects
      const cookie = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
      if (cookie.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');
      let data;

      switch (message.kind) {
        case 'start':
          data = [
            {
              country: 'United States',
              city: 'Seattle, Washington',
              ip: '91.240.75.212',
              map: 'https://osm.org/go/WIdEVZFE',
            },
            {
              country: 'Netherlands',
              city: 'Amsterdam',
              ip: '180.4.61.56',
              map: 'https://osm.org/go/0E4~sd',
            },
            {
              country: 'France',
              city: 'Paris',
              ip: '24.68.162.1',
              map: 'https://osm.org/go/0BOd2l~--',
            },
            {
              country: 'Australia',
              city: 'Sydney',
              ip: '110.212.129.122',
              map: 'https://osm.org/go/uN~RKL',
            },
          ];

          ws.send({locations: data});
          break;
      }
    },
  });
