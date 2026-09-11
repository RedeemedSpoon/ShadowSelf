import {origin, request, store, remove} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  await remove('cookie');

  const button = document.querySelector('button');
  const status = document.querySelector('small');

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerText = 'Synchronizing...';

    try {
      const tabs = await chrome.tabs.query({url: `https://${origin}/*`, currentWindow: true});
      const tab = tabs.find((item) => item.active) ?? tabs.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
      if (!tab) {
        await chrome.tabs.create({url: `https://${origin}/dashboard`, active: true});
        status.innerText = 'Sign in, then synchronize from that browser window.';
        return;
      }

      await store('accountTab', tab.id);
      const response = await request(`https://${origin}/api/proxy`);
      if (!response || typeof response !== 'object') {
        status.innerText = response || 'Could not synchronize this account.';
        return;
      }

      await store('username', response.username);
      await store('identities', response.identities);
      location.href = '../dashboard/dashboard.html?ignore=true';
    } finally {
      button.innerText = 'Synchronize';
      button.disabled = false;
    }
  });
});
