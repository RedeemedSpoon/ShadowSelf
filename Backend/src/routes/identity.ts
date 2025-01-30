import {WSConnections} from '../connection';
import {Elysia, t} from 'elysia';

export default new Elysia().ws('/ws', {
  open(ws) {
    console.log(ws);
  },
  message(ws) {
    console.log(ws);
  },
});
