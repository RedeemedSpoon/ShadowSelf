export const origin = chrome.runtime.getManifest().version === '0.0.0' ? 'localhost' : 'shadowself.io';
export const isChrome = !!chrome.runtime.getManifest().externally_connectable;

export async function read(key) {
  return (await chrome.storage.local.get(key))[key];
}

export async function store(key, value) {
  await chrome.storage.local.set({[key]: value});
}

export async function remove(key) {
  return await chrome.storage.local.remove(key);
}

export async function sleep(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}

export async function request(url, method = 'GET') {
  if (url !== `https://${origin}/api/proxy` || method !== 'GET') throw new Error('Unsupported extension request');

  const tabId = await read('accountTab');
  if (!Number.isInteger(tabId)) return 'Select a signed-in ShadowSelf tab first.';

  try {
    const tab = await chrome.tabs.get(tabId);
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
