import {store} from './shared.js';

chrome.runtime.onMessage.addListener((request) => {
  switch (request.type) {
    case 'connect': {
      connect(request);
      break;
    }

    case 'disconnect': {
      disconnect(request);
      break;
    }
  }
});

async function connect(request) {
  const {server, protocol, port, username, password} = request;

  const proxySettings = {
    value: {
      mode: 'fixed_servers',
      rules: {
        singleProxy: {
          scheme: protocol,
          host: server,
          port: port,
        },
        bypassList: ['<local>'],
      },
    },
    scope: 'regular',
  };

  const allowed = await chrome.extension.isAllowedIncognitoAccess();

  if (!allowed) {
    return chrome.notifications.create('proxy-error', {
      type: 'basic',
      title: 'Proxy Error',
      message: 'Your browser does not allow incognito access to proxy settings. Please enable incognito mode and try again.',
      iconUrl: 'assets/favicon.ico',
    });
  }

  chrome.proxy.settings.set(proxySettings, async () => {
    if (chrome.runtime.lastError) {
      return chrome.notifications.create('proxy-error', {
        type: 'basic',
        title: 'Proxy Error',
        message: 'Proxy settings could not be applied. Please try again later.',
        iconUrl: 'assets/favicon.ico',
      });
    }

    await store('proxyConfig', {host: server, port});
    await store('proxyCredentials', {username, password});
  });
}

function disconnect() {}
