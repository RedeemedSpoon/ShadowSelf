import {testProxyConnection, disableNetworking, createProxyRule, clearRule, checkIncognito} from './utils.js';
import {read, store, remove, isChrome} from '../shared.js';

export async function toggleKillSwitch(enabled) {
  const isVPNEnabled = await read('isVPNEnabled');
  await store('killSwitch', enabled);

  if (isVPNEnabled === 'on') return;
  if (enabled) disableNetworking();
  else await clearRule();
}

export async function connect(request) {
  const {server, username, domain, password} = request;

  if (await checkIncognito()) return true;
  if (isChrome) await createProxyRule(domain);

  await store('proxyConfig', {host: domain, ip: server});
  await store('proxyCredentials', {username, password});
  const error = await testProxyConnection();

  if (error) disconnect();
  else await store('isVPNEnabled', 'on');

  return error;
}

export async function disconnect() {
  const killSwitch = await read('killSwitch');
  if (killSwitch) disableNetworking();
  else await clearRule();

  await store('isVPNEnabled', 'off');
  await remove('proxyCredentials');
  await remove('proxyConfig');

  return !!chrome.runtime.lastError;
}

chrome.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    const config = await read('proxyConfig');
    const creds = await read('proxyCredentials');

    const canAuthenticate = config && creds?.username && details.isProxy;
    const sameChallenger = details.challenger.host === config.host;

    if (canAuthenticate && sameChallenger) {
      const auth = {username: creds.username, password: creds.password};
      callback({authCredentials: auth});
    } else callback();
  },
  {urls: ['<all_urls>']},
  ['asyncBlocking'],
);

if (!isChrome) {
  chrome.proxy.onRequest.addListener(
    async () => {
      const {host} = await read('proxyConfig');
      return host ? {type: 'https', host, port: 3128} : {type: 'direct'};
    },
    {urls: ['<all_urls>']},
  );
}
