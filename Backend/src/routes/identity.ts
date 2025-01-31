import {sql, WSConnections} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {Elysia} from 'elysia';
import {User} from '../types';

export default new Elysia().use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string})).ws('/ws', {
  async beforeHandle(ws) {
    const token = ws.cookie?.token?.value;
    if (!token) return ws.error(401, 'You are not logged in');

    const user = (await ws.jwt.verify(token)) as User;
    if (!user) return ws.error(401, 'You are not a valid user');

    const account = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    if (!account.length) return ws.error(401, 'You are not a valid user');

    const identityID = ws.query.id as string;
    if (!identityID) return ws.error(400, 'Missing or invalid query id. Try again');

    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID}`);
    if (!identity.length) return ws.error(400, 'Identity not found. Try again');

    const owner = identity[0].owner;
    if (owner !== account[0].id) return ws.error(400, 'You are not the owner of this identity');
  },
  open(ws) {
    WSConnections.set(ws.id, ws);
  },
  close(ws) {
    WSConnections.delete(ws.id);
  },
});
