import WebSocket from 'ws';

const url = `wss://shadowself.io/ws-api/${process.env.IDENTITY_ID}`;
const headers = {Authorization: `Bearer ${process.env.API_KEY}`};
const ws = new WebSocket(url, {headers});

ws.on('open', () => {
  setInterval(() => ws.ping(), 45000);
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  if (event.type) {
    console.log(`Received event: ${event.type}`);
  }
});
