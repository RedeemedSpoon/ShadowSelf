export const origin = chrome.runtime.getManifest().version === '0.0.0' ? 'localhost' : 'shadowself.io';
export const isChrome = !!chrome.runtime.getManifest().externally_connectable;
const sessionTokenStorageKey = 'cookie';

export async function read(key) {
  return (await chrome.storage.local.get(key))[key];
}

export async function store(key, value) {
  await chrome.storage.local.set({[key]: value});
}

export async function remove(key) {
  return await chrome.storage.local.remove(key);
}

export async function clearStoredSessionToken() {
  await remove(sessionTokenStorageKey);
}

export async function sleep(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}

export async function getSessionToken({openLogin = false} = {}) {
  await clearStoredSessionToken();

  const token = await readSessionCookie();
  if (token || !openLogin) return token;

  const tab = await findOrCreateShadowSelfTab();
  if (!isChrome) {
    chrome.windows.update(tab.windowId, {focused: true});
    chrome.tabs.update(tab.id, {active: true});
  }

  await sleep(1000);
  return await readSessionCookie(tab.cookieStoreId);
}

export async function request(url, method, data) {
  const token = await getSessionToken();
  if (!token) return 'Failed to fetch ShadowSelf token cookie.\nPlease login to ShadowSelf in your browser.';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) return await response.text();
  return await response.json();
}

async function readSessionCookie(storeId) {
  const option = {
    url: 'https://' + origin,
    name: 'token',
  };

  if (storeId) option.storeId = storeId;

  const cookie = (await chrome.cookies.getAll(option)) || [];
  return cookie[0]?.value;
}

async function findOrCreateShadowSelfTab() {
  const tabs = await chrome.tabs.query({url: `https://*.${origin}/*`});
  if (tabs.length) return tabs[0];
  return await chrome.tabs.create({url: `https://${origin}/dashboard`, active: true});
}
