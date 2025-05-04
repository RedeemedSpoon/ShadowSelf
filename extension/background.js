import {connect, disconnect, updateIcon, toggleKillSwitch, disableNetworking} from './proxy.js';
import {spoofUserAgent} from './user-agent.js';
import {read, store} from './shared.js';

chrome.runtime.onInstalled.addListener(async () => {
  await store('agent-browser', 'Chrome');
  await store('agent-os', 'Windows');
  await store('actualAgent', true);
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  (async () => {
    let error;

    switch (request.type) {
      case 'connect':
        error = await connect(request);
        await updateIcon();
        break;

      case 'disconnect':
        error = await disconnect(request);
        await updateIcon();
        break;

      case 'killSwitch':
        await toggleKillSwitch(request.enabled);
        break;

      case 'userAgent':
        await spoofUserAgent();
        break;
    }

    sendResponse(error);
  })();

  return true;
});

chrome.runtime.onStartup.addListener(async () => {
  const killSwitch = await read('killSwitch');
  const isVPNEnabled = await read('isVPNEnabled');
  if (killSwitch && !isVPNEnabled) disableNetworking();
  await updateIcon();
});

chrome.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    const config = await read('proxyConfig');
    const creds = await read('proxyCredentials');

    const canAuthenticate = config && creds?.username && details.isProxy;
    const sameChallenger = details.challenger.host === config.host && details.challenger.port === Number(config.port);

    if (canAuthenticate && sameChallenger) {
      const auth = {username: creds.username, password: creds.password};
      callback({authCredentials: auth});
    } else callback();
  },
  {urls: ['<all_urls>']},
  ['asyncBlocking'],
);
