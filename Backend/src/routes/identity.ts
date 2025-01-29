import {WSConnections} from '../connection';
import {Elysia, t} from 'elysia';

export default new Elysia().ws('/websocket', {
  params: t.Object({token: t.String()}),
  open(ws) {
    WSConnections.set(ws.data.params.token, ws);
  },
  close(ws) {
    WSConnections.delete(ws.data.params.token);
  },
  message(ws, body) {
    console.log(body);
  },
});
