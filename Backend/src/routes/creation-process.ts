import {sql, WSConnections} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {Elysia, t} from 'elysia';
import {User} from '../types';

export default new Elysia({prefix: '/ws-creation-process'}).use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string})).ws('/', {
  query: t.Object({id: t.String()}),
  async open(ws) {
    const token = ws.data.cookie?.token?.value;
    if (!token) return ws.close(1014, 'You are not logged in');

    const user = (await ws.data.jwt.verify(token)) as User;
    if (!user) return ws.close(1014, 'You are not a valid user');

    const account = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    if (!account.length) return ws.close(1014, 'You are not a valid user');

    const identityID = ws.data.query.id;
    if (!identityID) return ws.close(1014, 'Missing or invalid query id. Try again');

    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID}`);
    if (!identity.length) return ws.close(1014, 'Identity not found. Try again');

    const owner = identity[0].owner;
    if (owner !== account[0].id) return ws.close(1014, 'You are not the owner of this identity');

    WSConnections.set(ws.data.query.id, ws);
  },
  async message(ws, message) {
    const validationCookie = ws.data.cookie['creation-process']?.value;
    if (!validationCookie) return ws.close(1014, 'You do not have permission to perform this action');
    const identityID = ws.data.query.id;

    //@ts-expect-error JWT only accept objects
    const cookie = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
    if (cookie.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');

    console.log(message);
  },
  close(ws) {
    WSConnections.delete(ws.id);
  },
});
