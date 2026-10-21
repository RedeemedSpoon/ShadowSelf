export const ACCOUNT_PATH = '/api/extension';

export function applicationOrigin(manifest) {
  return new URL(manifest.homepage_url).origin;
}

export function isAccountTab(tab, windowId, origin) {
  if (!Number.isInteger(tab?.id) || tab.windowId !== windowId) {
    return false;
  }

  try {
    return new URL(tab.url).origin === origin;
  } catch {
    return false;
  }
}

export async function readAccountInTab(expectedOrigin, path) {
  if (location.origin !== expectedOrigin || path !== '/api/extension') {
    return {error: {message: 'The selected tab is no longer on ShadowSelf.'}};
  }

  try {
    const response = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: {Accept: 'application/json'},
    });

    const data = await response.json();

    if (!response.ok) {
      return {error: {message: data.error?.message || 'Sign in to the selected tab and retry.'}};
    }

    return data;
  } catch {
    return {error: {message: 'Could not reach your account. Check the selected tab and retry.'}};
  }
}

export function createAccountBridge(browser, origin) {
  const key = (windowId) => {
    if (!Number.isInteger(windowId) || windowId < 0) {
      throw new Error('No browser window selected.');
    }

    return `window:${windowId}:accountTab`;
  };

  async function readAccount(tabId, windowId) {
    const tab = await browser.tabs.get(tabId);

    if (!isAccountTab(tab, windowId, origin)) {
      throw new Error('Select a ShadowSelf tab in this browser window.');
    }

    const results = await browser.scripting.executeScript({
      target: {tabId, frameIds: [0]},
      func: readAccountInTab,
      args: [origin, ACCOUNT_PATH],
    });

    const data = results[0]?.result;

    if (data?.error) {
      throw new Error(data.error.message || 'Could not read your account.');
    }

    if (typeof data?.username !== 'string' || !Array.isArray(data.identities)) {
      throw new Error('Unexpected account response. Retry shortly.');
    }

    if (!data.identities.every((identity) => typeof identity.id === 'string' && typeof identity.name === 'string')) {
      throw new Error('Unexpected identity response. Retry shortly.');
    }

    const currentTab = await browser.tabs.get(tabId);

    if (!isAccountTab(currentTab, windowId, origin)) {
      throw new Error('The selected tab moved or closed. Select it again.');
    }

    return data;
  }

  return {
    async tabs(windowId) {
      key(windowId);

      const tabs = await browser.tabs.query({windowId});

      return tabs.filter((tab) => isAccountTab(tab, windowId, origin));
    },
    async bind(tabId, windowId) {
      const storageKey = key(windowId);
      const account = await readAccount(tabId, windowId);
      await browser.storage.session.set({[storageKey]: tabId});

      return account;
    },
    async account(windowId) {
      const storageKey = key(windowId);
      const stored = await browser.storage.session.get(storageKey);

      const tabId = stored[storageKey];

      if (!Number.isInteger(tabId)) {
        return null;
      }

      return readAccount(tabId, windowId);
    },
    async openIdentity(windowId, identityID) {
      const storageKey = key(windowId);
      const stored = await browser.storage.session.get(storageKey);
      const tabId = stored[storageKey];
      const account = await readAccount(tabId, windowId);

      if (!account.identities.some((identity) => identity.id === identityID)) {
        throw new Error('This identity is no longer available. Refresh your account.');
      }

      const opened = await browser.tabs.duplicate(tabId);
      await browser.tabs.update(opened.id, {
        url: `${origin}/identity/${encodeURIComponent(identityID)}`,
        active: true,
      });
    },
    async disconnect(windowId) {
      await browser.storage.session.remove(key(windowId));
    },
  };
}
