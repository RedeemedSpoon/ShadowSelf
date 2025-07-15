import axios from 'axios';
import {HttpsProxyAgent} from 'hpagent';

const agent = new HttpsProxyAgent({
  proxy: `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
});

axios.get('https://httpbin.org/ip', {httpsAgent: agent}).then((res) => console.log(res.data));
