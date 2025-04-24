export const origin = chrome.runtime.getManifest().version === 'dev' ? 'localhost' : 'shadowself.io';

export async function read(key) {
  return (await chrome.storage.local.get(key))[key];
}

export async function store(key, value) {
  await chrome.storage.local.set({[key]: value});
}

export async function remove(key) {
  return await chrome.storage.local.remove(key);
}

export async function reset() {
  return await chrome.storage.local.clear();
}

export async function sleep(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}

export async function request(url, method, data) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (await read('cookie')),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) return await response.text();
  return await response.json();
}
