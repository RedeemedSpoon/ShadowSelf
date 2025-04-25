import {origin, request, read, store, remove, sleep} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cookie = await read('cookie');
  if (!cookie) location.href = '../welcome/welcome.html';

  const logoutBtn = document.getElementById('logout-button');
  logoutBtn.addEventListener('click', async () => {
    await remove('cookie');
    location.href = '../welcome/welcome.html';
  });

  const identities = await initialize();
  await listIdentities(identities);
  addSearch(identities);
});

function addSearch(identities) {
  const searchBox = document.getElementById('input[type=search]');
  searchBox.addEventListener('input', () => {
    console.log(searchBox.value, identities);
  });
}

async function listIdentities() {}

async function initialize() {
  const loadingSection = document.getElementById('loading');
  const identitiesSection = document.getElementById('list-identities');
  const noIdentitiesSection = document.getElementById('no-identities');
  const alreadySynced = await read('already-synced');

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

  const usernameElement = document.getElementById('username');
  usernameElement.innerText = username.length > 6 ? username.slice(0, 6) + '..' : username;

  return identities;
}
