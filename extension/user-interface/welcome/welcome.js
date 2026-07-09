import {sleep, request, store, remove, getSessionToken, clearStoredSessionToken} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  await clearStoredSessionToken();

  const params = new URLSearchParams(window.location.search);
  if (params.has('delete') && params.get('delete') === 'true') {
    await remove(['authenticated', 'username', 'identities']);
  }

  const button = document.querySelector('button');
  const status = document.querySelector('small');

  button.addEventListener('click', async () => {
    status.innerText = '';
    button.innerText = 'Fetching...';
    button.disabled = true;
    await sleep(500);

    const token = await getSessionToken({openLogin: true});
    if (!token) {
      status.innerText = 'Failed to fetch ShadowSelf token cookie.\nPlease login to ShadowSelf in your browser.';
      button.innerText = 'Synchronize';
      button.disabled = false;
      return;
    }

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
    await store('authenticated', true);
    await store('username', response.username);
    await store('identities', response.identities);

    await sleep(500);
    location.href = '../dashboard/dashboard.html?ignore=true';
  });
});
