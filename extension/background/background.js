import {connect, disconnect, toggleKillSwitch} from './proxy.js';
import {updateIcon, disableNetworking} from './utils.js';
import {spoofUserAgent} from './user-agent.js';
import {read, store} from '../shared.js';

chrome.runtime.onInstalled.addListener(async () => {
  await store('agent-browser', 'chrome');
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
  if (killSwitch && isVPNEnabled === 'off') disableNetworking();
  await updateIcon();
});
