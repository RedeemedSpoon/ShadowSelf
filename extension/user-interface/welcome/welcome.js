import {origin, sleep, request, store, remove, isChrome} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('delete') && params.get('delete') === 'true') {
    await remove('cookie');
  }

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

    const response = await request(`https://${origin}/api/proxy`, 'GET');
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
    location.href = '../dashboard/dashboard.html?ignore=true';
  });
});

async function fetchCookie() {
  let shadowselfTab, cookie;

  chrome.tabs.query({url: `https://*.${origin}/*`}, async (tabs) => {
    if (tabs.length) shadowselfTab = tabs[0];
    else shadowselfTab = await chrome.tabs.create({url: `https://${origin}/dashboard`, active: true});

    if (!isChrome) {
      chrome.windows.update(shadowselfTab.windowId, {focused: true});
      chrome.tabs.update(shadowselfTab.id, {active: true});
    }

    await sleep(1000);
    const option = {
      storeId: shadowselfTab.cookieStoreId,
      url: 'https://' + origin,
      name: 'token',
    };

    cookie = (await chrome.cookies.getAll(option)) || [];
  });

  while (!cookie) await sleep(25);
  return cookie[0]?.value;
}
