import {Elysia} from 'elysia';

export default new Elysia().ws('/websocket', {
  open(ws) {
    ws.send('Connected');
  },
  message(ws, data) {
    ws.send(data);
  },
  close(ws) {
    ws.close();
  },
});
