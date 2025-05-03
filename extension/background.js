import {isChrome, read, store, remove} from './shared.js';

chrome.runtime.onStartup.addListener(updateIcon);
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
    }

    sendResponse(error);
  })();

  return true;
});

async function updateIcon() {
  const isVPNEnabled = await read('isVPNEnabled');
  if (!isVPNEnabled) return;

  chrome.action.setIcon({
    path: isVPNEnabled === 'on' ? 'assets/icon-enabled.png' : 'assets/icon-disabled.png',
  });
}

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

async function connect(request) {
  const {server, protocol, port, username, domain, password} = request;

  if (!(await chrome.extension.isAllowedIncognitoAccess())) {
    chrome.notifications.create('proxy-error-incognito', {
      type: 'basic',
      title: 'Proxy Setup Error',
      message: 'Please enable "Allow in Incognito" for this extension in chrome://extensions.',
      iconUrl: 'assets/favicon.ico',
    });

    return true;
  }

  const proxyApi = isChrome ? chrome.proxy : browser.proxy;
  const settingsValue = isChrome
    ? {mode: 'fixed_servers', rules: {singleProxy: {host: server, port: Number(port), scheme: protocol}}}
    : {proxyDNS: false, proxyType: 'manual', ssl: `${protocol}://${domain}:${port}`};

  await proxyApi.settings.clear({scope: 'regular'});
  await proxyApi.settings.set({value: settingsValue, scope: 'regular'});

  await store('proxyConfig', {host: domain, ip: server, port});
  await store('proxyCredentials', {username, password});

  const error = await testProxyConnection();
  if (!error) await store('isVPNEnabled', 'on');
  return error;
}

async function disconnect() {
  await chrome.proxy.settings.clear({scope: 'regular'});
  await store('isVPNEnabled', 'off');
  await remove('proxyCredentials');
  await remove('proxyConfig');

  return !!chrome.runtime.lastError;
}

async function testProxyConnection() {
  const apiErr = !!chrome.runtime.lastError;
  if (apiErr) return await displayError();

  const ctrl = new AbortController();
  const timerID = setTimeout(() => ctrl.abort(), 5000);

  try {
    const response = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
      method: 'GET',
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'no-cors',
    });

    clearTimeout(timerID);
    if (!response.ok || (response.status <= 200 && response.status > 300)) {
      return await displayError();
    }
  } catch {
    clearTimeout(timerID);
  }

  return false;
}

async function displayError() {
  chrome.notifications.create('proxy-err', {
    type: 'basic',
    title: 'Proxy Error',
    message: 'Failed to apply proxy settings, please try again later.',
    iconUrl: 'assets/favicon.ico',
  });

  await disconnect();
  return true;
}
