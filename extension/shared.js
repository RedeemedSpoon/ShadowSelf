export const origin = chrome.runtime.getManifest().version === '0.0.0' ? 'localhost' : 'shadowself.io';
export const isChrome = !!chrome.runtime.getManifest().externally_connectable;

const accountKeys = new Set(['accountTab', 'username', 'identities']);
const sessionKeys = new Set(['proxyConfig', 'proxyCredentials', 'isVPNEnabled']);

async function storageTarget(key, windowId) {
  if (accountKeys.has(key)) {
    const id = windowId ?? (await chrome.windows.getCurrent()).id;
    if (!Number.isInteger(id) || id < 0) throw new Error('No browser window selected');

    return {area: chrome.storage.session, key: `window:${id}:${key}`};
  }

  return {area: sessionKeys.has(key) ? chrome.storage.session : chrome.storage.local, key};
}

export async function read(key, windowId) {
  const target = await storageTarget(key, windowId);
  return (await target.area.get(target.key))[target.key];
}

export async function store(key, value, windowId) {
  const target = await storageTarget(key, windowId);
  await target.area.set({[target.key]: value});
}

export async function remove(key, windowId) {
  const target = await storageTarget(key, windowId);
  await target.area.remove(target.key);
}

export async function sleep(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}

export async function request(url, method = 'GET', windowId) {
  if (url !== `https://${origin}/api/proxy` || method !== 'GET') throw new Error('Unsupported extension request');

  const selectedWindow = windowId ?? (await chrome.windows.getCurrent()).id;
  const tabId = await read('accountTab', selectedWindow);
  if (!Number.isInteger(tabId)) return 'Select a signed-in ShadowSelf tab first.';

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.windowId !== selectedWindow) return 'The selected tab moved to another window.';
    if (new URL(tab.url).origin !== `https://${origin}`) return 'The selected tab is no longer on ShadowSelf.';

    const results = await chrome.scripting.executeScript({
      target: {tabId},
      func: async () => {
        const response = await fetch('/api/proxy', {credentials: 'same-origin', cache: 'no-store'});
        return response.ok ? await response.json() : await response.text();
      },
    });

    return results[0]?.result ?? 'Could not read this account. Sign in and try again.';
  } catch {
    return 'The selected ShadowSelf tab is unavailable. Synchronize again.';
  }
}
