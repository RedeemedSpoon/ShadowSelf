import {applicationOrigin, isAccountTab} from '../shared.js';

const origin = applicationOrigin(chrome.runtime.getManifest());

async function clearBindings(matches) {
  const values = await chrome.storage.session.get(null);

  const keys = Object.entries(values)
    .filter(([key, tabId]) => key.startsWith('window:') && key.endsWith(':accountTab') && matches(key, tabId))
    .map(([key]) => key);

  if (keys.length) {
    await chrome.storage.session.remove(keys);
  }
}

chrome.windows.onRemoved.addListener((windowId) => {
  void clearBindings((key) => key === `window:${windowId}:accountTab`);
});

chrome.tabs.onRemoved.addListener((removedTab) => {
  void clearBindings((_key, tabId) => tabId === removedTab);
});

chrome.tabs.onDetached.addListener((detachedTab) => {
  void clearBindings((_key, tabId) => tabId === detachedTab);
});

chrome.tabs.onUpdated.addListener((updatedTab, change, tab) => {
  if (change.url && !isAccountTab(tab, tab.windowId, origin)) {
    void clearBindings((_key, tabId) => tabId === updatedTab);
  }
});
