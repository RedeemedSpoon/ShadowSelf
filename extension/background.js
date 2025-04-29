import {read, store} from './shared.js';

let currentAuthHandler = null;

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
    await setupAuthListener();
  });
}

function disconnect() {}

async function setupAuthListener() {
  await clearAuthListener();

  currentAuthHandler = async (details, callback) => {
    if (!details.isProxy) {
      callback();
      return;
    }

    console.log(`Proxy authentication required by: ${details.challenger.host}:${details.challenger.port}`);
    const credentials = await read('proxyCredentials');

    callback({
      authCredentials: {
        username: credentials.username,
        password: credentials.password,
      },
    });
  };

  if (!chrome.webRequest.onAuthRequired.hasListener(currentAuthHandler)) {
    chrome.webRequest.onAuthRequired.addListener(currentAuthHandler, {urls: ['<all_urls>']}, ['asyncBlocking']);
  }
}

async function clearAuthListener() {
  if (currentAuthHandler && chrome.webRequest.onAuthRequired.hasListener(currentAuthHandler)) {
    chrome.webRequest.onAuthRequired.removeListener(currentAuthHandler);
  }

  currentAuthHandler = null;
}
