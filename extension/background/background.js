import {connect, disconnect, toggleKillSwitch} from './proxy.js';
import {updateIcon} from './utils.js';
import {spoofUserAgent} from './user-agent.js';

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.remove(['cookie', 'accountTab', 'username', 'identities', 'proxyCredentials', 'proxyConfig', 'isVPNEnabled']);
  await disconnect();
  await spoofUserAgent();
});

let pendingChange = Promise.resolve();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL('user-interface/'))) return false;
  pendingChange = pendingChange
    .then(async () => {
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
    })
    .catch(async () => {
      await disconnect().catch(() => {});
      sendResponse(true);
    });

  return true;
});

chrome.runtime.onStartup.addListener(async () => {
  await disconnect();
  await updateIcon();
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const values = await chrome.storage.session.get(null);
  const keys = Object.keys(values).filter((key) => key.startsWith(`window:${windowId}:`));
  await chrome.storage.session.remove(keys);

  if (values.proxyConfig?.windowId === windowId) {
    await disconnect();
    await updateIcon();
  }
});
