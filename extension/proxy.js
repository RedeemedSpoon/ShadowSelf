import {isChrome, read, store, remove} from './shared.js';

export async function updateIcon() {
  const isVPNEnabled = await read('isVPNEnabled');
  if (!isVPNEnabled) return;

  const path = isVPNEnabled === 'on' ? 'enabled' : 'disabled';
  chrome.action.setIcon({path: `assets/icon-${path}.png`});
}

export async function toggleKillSwitch(enabled) {
  await store('killSwitch', enabled);
  const isVPNEnabled = await read('isVPNEnabled');
  const proxyApi = isChrome ? chrome.proxy : browser.proxy;

  if (enabled && isVPNEnabled === 'off') disableNetworking();
  else await proxyApi.settings.clear({scope: 'regular'});
}

export async function connect(request) {
  const {server, protocol, port, username, domain, password} = request;

  if (!(await chrome.extension.isAllowedIncognitoAccess())) {
    chrome.notifications.create('proxy-error-incognito', {
      type: 'basic',
      title: 'Proxy Setup Error',
      message: 'Please enable incognito/private mode in your browser settings to use ShadowSelf.',
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

export async function disconnect() {
  const killSwitch = await read('killSwitch');
  if (killSwitch) disableNetworking();
  else await chrome.proxy.settings.clear({scope: 'regular'});

  await store('isVPNEnabled', 'off');
  await remove('proxyCredentials');
  await remove('proxyConfig');

  return !!chrome.runtime.lastError;
}

export async function testProxyConnection() {
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

export async function displayError() {
  chrome.notifications.create('proxy-err', {
    type: 'basic',
    title: 'Proxy Error',
    message: 'Failed to apply proxy settings, please try again later.',
    iconUrl: 'assets/favicon.ico',
  });

  await disconnect();
  return true;
}

export async function disableNetworking() {
  const proxyApi = isChrome ? chrome.proxy : browser.proxy;
  const proxyConfig = isChrome
    ? {mode: 'fixed_servers', rules: {singleProxy: {host: '127.0.0.1', port: 9, scheme: 'http'}}}
    : {proxyDNS: false, proxyType: 'manual', ssl: 'https://127.0.0.1:9', http: 'http://127.0.0.1:9'};

  await proxyApi.settings.set({value: proxyConfig, scope: 'regular'});
}
