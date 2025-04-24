import {origin, request, read, store, remove, sleep} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cookie = await read('cookie');
  if (!cookie) location.href = '../welcome/welcome.html';

  const loadingSection = document.getElementById('loading');
  const logoutBtn = document.getElementById('logout-button');
  const identitiesSection = document.getElementById('list-identities');
  const noIdentitiesSection = document.getElementById('no-identities');
  const alreadySynced = await read('already-synced');

  logoutBtn.addEventListener('click', async () => {
    await remove('cookie');
    location.href = '../welcome/welcome.html';
  });

  if (alreadySynced) await remove('already-synced');
  else {
    const loadingBtn = document.getElementById('loading-button');
    const loadingError = document.getElementById('loading-error');
    loadingSection.style.display = 'flex';

    const loading = setInterval(() => {
      if (loadingBtn.innerText.length === 10) loadingBtn.innerText = 'Loading';
      else loadingBtn.innerText += '.';
    }, 250);

    await sleep(750);
    const response = await request(`https://${origin}/extension-api`, 'GET');
    if (typeof response !== 'object') {
      loadingError.innerText = response + '\nPlease try again.';
      clearInterval(loading);
      return;
    }

    await store('username', response.username);
    await store('identities', response.identities);

    clearInterval(loading);
    loadingSection.style.display = 'none';
  }

  const username = await read('username');
  const identities = await read('identities');

  if (!identities.length) return (noIdentitiesSection.style.display = 'flex');
  else identitiesSection.style.display = 'flex';

  document.getElementById('username').innerText = username;
});
