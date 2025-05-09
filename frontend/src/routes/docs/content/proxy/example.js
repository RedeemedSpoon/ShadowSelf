import axios from 'axios';
import {HttpsProxyAgent} from 'hpagent';

const proxyHost = process.env.PROXY_HOST;
const proxyPort = process.env.PROXY_PORT;
const proxyUser = process.env.PROXY_USER;
const proxyPass = process.env.PROXY_PASS;

const targetUrl = 'https://httpbin.org/ip';
const proxyString = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;

const agent = new HttpsProxyAgent({
  keepAlive: true,
  proxy: proxyString,
});

async function requestViaProxy() {
  try {
    const response = await axios.get(targetUrl, {httpsAgent: agent});
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let errMsg = 'Error making request: ';
    if (error.response) {
      errMsg += `${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else {
      errMsg += error.message;
    }
    console.error(errMsg);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

requestViaProxy();
