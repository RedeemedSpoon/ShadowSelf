import {applicationOrigin, isAccountTab} from '../shared.js';

const origin = applicationOrigin(chrome.runtime.getManifest());

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    message?.type !== 'open-website-popup' ||
    sender.id !== chrome.runtime.id ||
    sender.frameId !== 0 ||
    !isAccountTab(sender.tab, sender.tab?.windowId, origin)
  ) {
    return false;
  }

  try {
    if (new URL(sender.url).origin !== origin) {
      return false;
    }
  } catch {
    return false;
  }

  chrome.action.openPopup({windowId: sender.tab.windowId}).then(
    () => respond({opened: true}),
    () => respond({opened: false}),
  );

  return true;
});

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
