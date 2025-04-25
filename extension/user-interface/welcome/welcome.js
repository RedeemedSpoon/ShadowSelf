import {origin, sleep, request, store} from '../../shared.js';

async function fetchCookie() {
  let shadowselfTab, cookie;

  chrome.tabs.query({url: `https://*.${origin}/*`}, async (tabs) => {
    if (tabs.length) shadowselfTab = tabs[0];
    else shadowselfTab = await chrome.tabs.create({url: `https://${origin}/dashboard`, active: true});

    chrome.windows.update(shadowselfTab.windowId, {focused: true});
    chrome.tabs.update(shadowselfTab.id, {active: true});
    await sleep(1000);

    cookie =
      (await chrome.cookies.getAll({
        storeId: shadowselfTab.cookieStoreId,
        url: 'https://' + origin,
        name: 'token',
      })) || [];
  });

  while (!cookie) await sleep(25);
  return cookie[0]?.value;
}

document.addEventListener('DOMContentLoaded', async () => {
  const button = document.querySelector('button');
  const status = document.querySelector('small');

  button.addEventListener('click', async () => {
    status.innerText = '';
    button.innerText = 'Fetching...';
    button.disabled = true;
    await sleep(500);

    const token = await fetchCookie();
    if (!token) {
      status.innerText = 'Failed to fetch ShadowSelf token cookie.\nPlease login to ShadowSelf in your browser.';
      button.innerText = 'Synchronize';
      button.disabled = false;
      return;
    }

    button.innerText = 'Storing...';
    await store('cookie', token);
    await sleep(1000);

    button.innerText = 'Syncing...';
    await sleep(750);

    const response = await request(`https://${origin}/extension-api`, 'GET');
    if (typeof response !== 'object') {
      status.innerText = response;
      button.innerText = 'Synchronize';
      button.disabled = false;
      return;
    }

    button.innerText = 'Finishing...';
    await store('username', response.username);
    await store('identities', response.identities);
    await sleep(500);

    await store('already-synced', true);
    location.href = '../dashboard/dashboard.html';
  });
});
