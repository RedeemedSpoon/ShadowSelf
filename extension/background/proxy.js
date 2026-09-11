import {testProxyConnection, disableNetworking, createProxyRule, clearRule, checkIncognito} from './utils.js';
import {read, store, remove, isChrome, request as requestAccount, origin} from '../shared.js';

export async function toggleKillSwitch(enabled) {
  const isVPNEnabled = await read('isVPNEnabled');
  await store('killSwitch', enabled);

  if (isVPNEnabled === 'on') return;
  if (enabled) await disableNetworking();
  else await clearRule();
}

export async function connect(request) {
  const response = await requestAccount(`https://${origin}/api/proxy`, 'GET', request.windowId);
  const identity = response?.identities?.find((item) => item.id === request.identity);
  if (!identity) return true;

  const {server, username, domain, password} = identity;

  if (await checkIncognito()) return true;

  await store('proxyConfig', {host: domain, ip: server, identity: identity.id, windowId: request.windowId});
  await store('proxyCredentials', {username, password});
  if (isChrome) await createProxyRule(domain);

  const error = await testProxyConnection();

  if (error) await disconnect();
  else await store('isVPNEnabled', 'on');

  return error;
}

export async function disconnect() {
  const killSwitch = await read('killSwitch');
  if (killSwitch) await disableNetworking();
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
    const sameChallenger = details.challenger?.host === config?.host && details.challenger?.port === 3128;

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
      const host = (await read('proxyConfig'))?.host;
      return host ? {type: 'https', host, port: 3128} : {type: 'direct'};
    },
    {urls: ['<all_urls>']},
  );
}
