import WebSocket from 'ws';
import process from 'process';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
if (!apiKey || !identityId) {
  console.error('Vars missing.');
  process.exit(1);
}

const wsUrl = `wss://shadowself.io/ws-api/${identityId}`;
const headers = {Authorization: `Bearer ${apiKey}`};
let pingIntervalId = null;

function connect() {
  const ws = new WebSocket(wsUrl, {headers});

  ws.on('open', () => {
    console.log(`Connected to ${identityId}`);
    if (pingIntervalId) clearInterval(pingIntervalId);
    pingIntervalId = setInterval(() => {
      // Send ping periodically
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 45000);
  });

  ws.on('message', (data) => {
    try {
      const event = JSON.parse(data.toString());
      console.log(`Received event: ${event?.type || 'Unknown'}`);
    } catch {
      /* Ignore non-JSON & pong */
    }
  });

  ws.on('pong', () => {
    /* Connection alive */
  });
  ws.on('error', (e) => console.error('WS Error:', e.message));
  ws.on('close', () => {
    console.log('WS Closed. Restart script to reconnect.');
    if (pingIntervalId) clearInterval(pingIntervalId);
  });
}
connect();
