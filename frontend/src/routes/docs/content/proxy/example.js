import axios from 'axios';
import {HttpsProxyAgent} from 'hpagent';
import process from 'process';

const proxyHost = process.env.PROXY_HOST;
const proxyPort = process.env.PROXY_PORT;
const proxyUser = process.env.PROXY_USER;
const proxyPass = process.env.PROXY_PASS;

if (!proxyHost || !proxyPort || !proxyUser || !proxyPass) {
  console.error('PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS env vars must be set.');
  process.exit(1);
}

const targetUrl = 'https://httpbin.org/ip';
const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;

const agent = new HttpsProxyAgent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  proxy: proxyUrl,
});

async function requestViaProxy() {
  console.log(`Making request to ${targetUrl} via proxy ${proxyHost}...`);
  try {
    const response = await axios.get(targetUrl, {
      httpsAgent: agent,
    });
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error making request via proxy:', error.response?.data || error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

requestViaProxy();
