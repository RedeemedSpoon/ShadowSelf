import {isChrome, read} from '../shared.js';

export async function updateIcon() {
  const isVPNEnabled = await read('isVPNEnabled');
  if (!isVPNEnabled) return;

  const path = isVPNEnabled === 'on' ? 'enabled' : 'disabled';
  chrome.action.setIcon({path: `../assets/icon-${path}.png`});
}

export async function checkIncognito() {
  const incognito = await chrome.extension.isAllowedIncognitoAccess();
  if (!incognito) {
    chrome.notifications.create('proxy-error-incognito', {
      type: 'basic',
      title: 'Proxy Setup Error',
      message: 'Please allow incognito access in your browser settings to use ShadowSelf.',
      iconUrl: '../assets/favicon.ico',
    });
  }

  return !incognito;
}

export async function createProxyRule(host) {
  const singleProxy = {host, port: 3128, scheme: 'https'};
  const settingsValue = {mode: 'fixed_servers', rules: {singleProxy}};

  await chrome.proxy.settings.clear({scope: 'regular'});
  await chrome.proxy.settings.set({value: settingsValue, scope: 'regular'});
}

export async function clearRule() {
  await chrome.proxy.settings.clear({scope: 'regular'});
}

export async function testProxyConnection() {
  const apiErr = !!chrome.runtime.lastError;
  if (apiErr) return displayError();

  const ctrl = new AbortController();
  const timerID = setTimeout(() => ctrl.abort(), 5000);

  try {
    const response = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'no-cors',
      method: 'GET',
    });

    clearTimeout(timerID);
    if (!response.ok || (response.status <= 200 && response.status > 300)) {
      return displayError();
    }
  } catch {
    clearTimeout(timerID);
    return displayError();
  }

  return false;
}

export function displayError() {
  chrome.notifications.create('proxy-error', {
    type: 'basic',
    title: 'Proxy Error',
    message: 'Failed to apply proxy settings, please try again later.',
    iconUrl: '../assets/favicon.ico',
  });

  return true;
}

export function disableNetworking() {
  if (isChrome) {
    const singleProxy = {host: '127.0.0.1', port: 9, scheme: 'http'};
    const proxyConfig = {mode: 'fixed_servers', rules: {singleProxy, bypassList: ['shadowself.io']}};
    chrome.proxy.settings.set({value: proxyConfig, scope: 'regular'});
  } else {
    const rules = {ssl: '127.0.0.1:9', http: '127.0.0.1:9'};
    const settings = {proxyDNS: false, proxyType: 'manual', passthrough: 'shadowself.io'};
    chrome.proxy.settings.set({value: {...settings, ...rules}, scope: 'regular'});
  }
}
