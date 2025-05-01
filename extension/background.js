import {isChrome, store} from './shared.js';

chrome.runtime.onMessage.addListener(async (request) => {
  let error;

  switch (request.type) {
    case 'connect':
      error = await connect(request);
      break;

    case 'disconnect':
      error = await disconnect(request);
      break;
  }

  return error;
});

async function connect(request) {
  const {server, domain, protocol, port, username, password} = request;

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
    ? {mode: 'fixed_servers', rules: {singleProxy: {scheme: protocol, host: domain, port: port}}}
    : {proxyType: 'manual', socksVersion: 5, socks: `${protocol}://${server}:${port}`, proxyDNS: false};

  await proxyApi.settings.clear({scope: 'regular'});
  await proxyApi.settings.set({value: settingsValue, scope: 'regular'});

  const error = await testProxyConnection();
  if (error) return error;

  await store('proxyConfig', {host: server, port});
  await store('proxyCredentials', {username, password});
  return error;
}

async function disconnect() {
  await chrome.proxy.settings.clear({scope: 'regular'});
  await store('proxyCredentials', null);
  await store('proxyConfig', null);
  return !!chrome.runtime.lastError;
}

async function testProxyConnection() {
  const apiErr = !!chrome.runtime.lastError;
  if (apiErr) return await displayError();

  const ctrl = new AbortController();
  const timerID = setTimeout(() => ctrl.abort(), 5000);
  let testOK = false;

  try {
    const response = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
      method: 'GET',
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'no-cors',
    });

    clearTimeout(timerID);
    if (response.ok || (response.status >= 200 && response.status < 300)) {
      testOK = true;
    }
  } catch {
    clearTimeout(timerID);
  }

  if (!testOK) return await displayError();
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
