import {applicationOrigin, createAccountBridge} from '../../shared.js';

const origin = applicationOrigin(chrome.runtime.getManifest());
const bridge = createAccountBridge(chrome, origin);
const element = (id) => document.getElementById(id);
let windowId;
let identities = [];
let pending = false;

element('website').href = `${origin}/dashboard`;

function status(message, error = false) {
  element('status').textContent = message;
  element('status').dataset.error = String(error);
}

async function run(action) {
  if (pending) {
    return;
  }

  pending = true;
  document.querySelectorAll('button').forEach((button) => (button.disabled = true));
  status('Connecting to your signed-in tab…');

  try {
    await action();
  } catch (error) {
    identities = [];
    element('identities').replaceChildren();
    element('account').hidden = true;
    element('connection').hidden = false;
    status(error instanceof Error ? error.message : 'Could not read your account. Retry shortly.', true);
  } finally {
    pending = false;
    document.querySelectorAll('button').forEach((button) => (button.disabled = false));
  }
}

function renderIdentities() {
  const search = element('search').value.toLocaleLowerCase().trim();
  const visible = identities.filter((identity) => `${identity.name} ${identity.location || ''}`.toLocaleLowerCase().includes(search));
  const container = element('identities');
  container.replaceChildren();
  element('empty').hidden = visible.length > 0;
  element('empty').textContent = identities.length ? 'No matching identities.' : 'No identities yet.';

  for (const identity of visible) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'identity';

    const initials = document.createElement('span');
    initials.className = 'initials';
    initials.textContent = identity.name.slice(0, 2).toUpperCase();

    const detail = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = identity.name || 'Identity setup';

    const location = document.createElement('small');
    location.textContent = identity.location || identity.status || 'Open identity';

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    detail.append(name, location);
    button.append(initials, detail, arrow);
    button.addEventListener('click', () => {
      void run(async () => {
        const account = await bridge.account(windowId);

        if (!account?.identities.some((item) => item.id === identity.id)) {
          throw new Error('This identity is no longer available. Refresh your account.');
        }

        await chrome.tabs.create({windowId, url: `${origin}/identity/${encodeURIComponent(identity.id)}`, active: true});
        status('Identity opened in this window.');
      });
    });
    container.append(button);
  }
}

function showAccount(account) {
  identities = account.identities;
  element('account-title').textContent = account.username;
  element('connection').hidden = true;
  element('account').hidden = false;
  renderIdentities();
  status('');
}

async function listTabs() {
  const tabs = await bridge.tabs(windowId);

  const select = element('account-tab');
  select.replaceChildren();

  const prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = tabs.length ? 'Select a tab' : 'Open ShadowSelf to connect';
  select.append(prompt);

  for (const tab of tabs) {
    const option = document.createElement('option');
    option.value = String(tab.id);
    option.textContent = `${tab.title || 'ShadowSelf'} · ${new URL(tab.url).pathname}`;
    select.append(option);
  }
}

element('search').addEventListener('input', renderIdentities);
element('connect').addEventListener('click', () => {
  void run(async () => {
    const selected = element('account-tab').value;

    if (!selected) {
      throw new Error('Choose a signed-in ShadowSelf tab first.');
    }

    showAccount(await bridge.bind(Number(selected), windowId));
  });
});
element('refresh').addEventListener('click', () => {
  void run(async () => {
    const account = await bridge.account(windowId);

    if (!account) {
      throw new Error('Select a signed-in ShadowSelf tab first.');
    }

    showAccount(account);
  });
});
element('disconnect').addEventListener('click', () => {
  void run(async () => {
    await bridge.disconnect(windowId);
    identities = [];
    element('identities').replaceChildren();
    element('search').value = '';
    element('account-title').textContent = '';
    element('account').hidden = true;
    element('connection').hidden = false;
    await listTabs();
    status('Disconnected. Your website session is still signed in.');
  });
});
element('open-dashboard').addEventListener('click', () => {
  void run(async () => {
    await chrome.tabs.create({windowId, url: `${origin}/dashboard`, active: true});
    await listTabs();
    status('Sign in to the new tab, then choose it here.');
  });
});

void run(async () => {
  windowId = (await chrome.windows.getCurrent()).id;
  await listTabs();

  const account = await bridge.account(windowId);

  if (account) {
    showAccount(account);
  } else {
    status('');
  }
});
