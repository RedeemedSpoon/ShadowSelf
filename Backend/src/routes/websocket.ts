import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
import {attempt} from '../utils';
import {User, WebsocketAPI} from '../types';
import {Elysia} from 'elysia';

export default new Elysia().use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string})).ws('/ws/api/:id', {
  async message(ws, message: WebsocketAPI | 'ping') {
    if (message === 'ping') return ws.send('pong');

    const cookie = ws.data.cookie['token'];
    if (!cookie) return ws.close(1014, 'You are not logged in');

    const user = (await ws.data.jwt.verify(cookie.value)) as User;
    if (!user?.email) return ws.close(1014, 'You do not logged in');

    const params = ws.data.params.id;
    const identity = (await attempt(sql`SELECT * FROM identities WHERE id = ${params}`))[0];
    if (!identity) return ws.close(1014, 'Identity not found. Please try again');

    const id = (await attempt(sql`SELECT id FROM users WHERE email = ${user!.email}`))[0].id;
    if (id !== identity.owner) return ws.close(1014, 'You do not authorize to perform this action');

    switch (message.type) {
      case 'regenerate-picture':
        break;

      case 'regenerate-name':
        break;

      case 'regenerate-bio':
        break;

      case 'update-information':
        break;

      default:
        ws.send({error: 'Invalid action. Please read the documentation carefully'});
        break;
    }
  },
});
