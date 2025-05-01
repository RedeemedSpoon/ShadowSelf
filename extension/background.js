import {isChrome, store} from './shared.js';

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
  const {server, domain, protocol, port, username, password} = request;

  if (!(await chrome.extension.isAllowedIncognitoAccess())) {
    return chrome.notifications.create('proxy-error', {
      type: 'basic',
      title: 'Proxy Error',
      message: 'Your browser does not allow incognito access to proxy settings. Please enable incognito mode and try again.',
      iconUrl: 'assets/favicon.ico',
    });
  }

  let proxySettings;
  await store('proxyConfig', {host: server, port});
  await store('proxyCredentials', {username, password});

  if (isChrome) {
    proxySettings = {
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {
            scheme: protocol,
            host: domain,
            port: port,
          },
        },
      },
    };

    await chrome.proxy.settings.clear({scope: 'regular'});
    chrome.proxy.settings.set(proxySettings, async () => {
      if (chrome.runtime.lastError) {
        return chrome.notifications.create('proxy-error', {
          type: 'basic',
          title: 'Proxy Error',
          message: 'Proxy settings could not be applied. Please try again later.',
          iconUrl: 'assets/favicon.ico',
        });
      }
    });
    return;
  }

  proxySettings = {
    socksVersion: 5,
    socks: `${protocol}://${server}:${port}`,
    proxyType: 'manual',
    proxtDNS: false,
  };

  browser.proxy.settings.clear({scope: 'regular'});
  browser.proxy.settings.set({value: proxySettings, scope: 'regular'});
}

function disconnect() {}
