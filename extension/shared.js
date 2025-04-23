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
