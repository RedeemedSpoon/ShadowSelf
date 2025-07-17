import {origin, request, read, store, sleep} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cookie = await read('cookie');
  if (!cookie) location.href = '../welcome/welcome.html';

  const identities = await initialize();
  listIdentities(identities);
  addSearch(identities);
});

function addSearch(identities) {
  const searchBox = document.getElementById('search');
  const container = document.getElementById('container');
  const notFound = document.getElementById('not-found');

  searchBox.addEventListener('input', () => {
    const value = searchBox.value.toLowerCase();
    const foundIdentities = identities.filter((identity) => identity.name.toLowerCase().includes(value));

    if (foundIdentities.length) {
      notFound.classList.remove('shown');
      container.classList.remove('not-found');

      identities.forEach((identity) => {
        const element = document.getElementById(identity.id);
        element.classList.add('hidden');
        element.classList.remove('last');
      });

      foundIdentities.forEach((identity, index) => {
        const element = document.getElementById(identity.id);
        element.classList.remove('hidden');

        if (index === foundIdentities.length - 1) {
          element.classList.add('last');
        }
      });
    } else {
      notFound.classList.add('shown');
      container.classList.add('not-found');
    }
  });
}

async function listIdentities(identities) {
  const container = document.getElementById('container');
  for (const identity of identities) {
    if (!identity.name) continue;

    const identityElement = document.createElement('div');
    identityElement.classList.add('identity');
    identityElement.id = identity.id;

    const picture = document.createElement('img');
    picture.src = 'data:image/png;base64,' + identity.picture;
    identityElement.appendChild(picture);

    const name = document.createElement('h3');
    name.innerText = identity.name;
    identityElement.appendChild(name);

    const location = document.createElement('p');
    const text = identity.location.split(', ');
    location.innerText = text[1] + ', ' + text[2];
    identityElement.appendChild(location);

    const url = chrome.runtime.getURL(`assets/countries/${text[0].toLowerCase()}.svg`);
    const stream = await (await fetch(url)).text();
    const countryFlag = new DOMParser().parseFromString(stream, 'text/html').documentElement;

    countryFlag.classList.add('flag');
    identityElement.appendChild(countryFlag);

    container.appendChild(identityElement);
    identityElement.addEventListener('click', () => {
      const query = new URLSearchParams({
        location: identity.location,
        server: identity.server,
        domain: identity.domain,
        username: identity.username,
        password: identity.password,
      });

      window.location.href = `../proxy/proxy.html?${query.toString()}`;
    });
  }
}

async function initialize() {
  const loadingSection = document.getElementById('loading');
  const identitiesSection = document.getElementById('list-identities');
  const noIdentitiesSection = document.getElementById('no-identities');

  const params = new URLSearchParams(window.location.search);
  const ignore = params.has('ignore') && params.get('ignore') === 'true';

  if (!ignore) {
    const loadingBtn = document.getElementById('loading-button');
    const loadingError = document.getElementById('loading-error');
    loadingSection.style.display = 'flex';

    const loading = setInterval(() => {
      if (loadingBtn.innerText.length === 10) loadingBtn.innerText = 'Loading';
      else loadingBtn.innerText += '.';
    }, 250);

    await sleep(750);
    const response = await request(`https://${origin}/api/proxy`, 'GET');
    if (typeof response !== 'object') {
      loadingError.innerText = response + '\nTry logging out and logging back in.';
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
