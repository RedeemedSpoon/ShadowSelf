import WebSocket from 'ws';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const wsUrl = `wss://shadowself.io/ws-api/${identityId}`;
const headers = {Authorization: `Bearer ${apiKey}`};
let pingIntervalId = null;

function handleMessage(data) {
  try {
    const event = JSON.parse(data.toString());
    if (event && event.type) {
      console.log(`Received event: ${event.type}`);
    }
  } catch (e) {
    console.error('Error parsing WebSocket message:', e);
  }
}

function connect() {
  const ws = new WebSocket(wsUrl, {headers});

  ws.on('open', () => {
    if (pingIntervalId) clearInterval(pingIntervalId);
    pingIntervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 45000);
  });

  ws.on('message', handleMessage);
  ws.on('error', (err) => console.error('WebSocket error:', err.message));
  ws.on('close', (code, reason) => {
    if (pingIntervalId) clearInterval(pingIntervalId);
    if (code !== 1000) {
      const reasonStr = reason ? reason.toString() : 'unknown';
      console.error(`WebSocket closed: ${code} - ${reasonStr}`);
    }
  });
}
connect();
