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
    let cookie = await jwt.sign(id + process.env.SECRET_SAUCE);
    cookie = cookie.split('.')[2];
    return {cookie};
  })
  .ws('/ws-creation-process', {
    query: t.Object({id: t.String()}),
    async message(ws, message: CreationProcess) {
      const cookie = ws.data.cookie['creation-process'];
      if (!cookie) return ws.close(1014, 'You do not have permission to perform this action');

      const [validationCookie, ...cookieStore] = cookie.value?.split('&&') || [];
      const identityID = ws.data.query.id;

      //@ts-expect-error JWT only accept objects
      const validToken = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
      if (validToken.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');

      switch (message.kind) {
        case 'start': {
          const locations = [
            {
              code: 'US',
              country: 'United States',
              city: 'Seattle',
              ip: '91.240.75.212',
              map: 'https://osm.org/go/WIdEVZFE',
            },
            {
              code: 'NL',
              country: 'Netherlands',
              city: 'Amsterdam',
              ip: '180.4.61.56',
              map: 'https://osm.org/go/0E4~sd',
            },
            {
              code: 'FR',
              country: 'France',
              city: 'Paris',
              ip: '24.68.162.1',
              map: 'https://osm.org/go/0BOd2l~--',
            },
            {
              code: 'AU',
              country: 'Australia',
              city: 'Sydney',
              ip: '110.212.129.122',
              map: 'https://osm.org/go/uN~RKL',
            },
          ];

          ws.send({locations});
          break;
        }

        case 'locations': {
          const {code} = message;
          if (!['US', 'NL', 'FR', 'AU'].includes(code)) {
            ws.send({error: 'Invalid location code'});
            break;
          }

          cookie.set({value: cookie.value + `&&${code}`});
          ws.send({status: 'success'});
          break;
        }
      }
    },
  });
