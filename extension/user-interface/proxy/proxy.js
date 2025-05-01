import {sleep, request, origin, read} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const [id, location, proxy] = params.values();

  const [country, ...place] = location.split(', ');
  const url = chrome.runtime.getURL(`assets/countries/${country.toLowerCase()}.svg`);

  document.getElementById('country-background').style.backgroundImage = `url("${url}")`;
  document.getElementById('ip-address').textContent = proxy.split('/')[0];
  document.getElementById('location').textContent = place.join(', ');

  await ConfigureVPN(id, proxy);

  const checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => {
    // Toggle kill switch
  });
});

async function ConfigureVPN(id, proxy) {
  const status = document.getElementById('status');
  const powerBtn = document.getElementById('power');
  const countryContainer = document.getElementById('country');
  const container = document.getElementById('button-container');
  const activeElements = [countryContainer, container, powerBtn];

  const proxyConfig = await read('proxyConfig');
  if (proxyConfig?.host === proxy) {
    status.textContent = 'Connected';
    activeElements.forEach((el) => el.classList.add('active'));
  }

  setTimeout(
    () =>
      activeElements.forEach((element) => {
        element.classList.add('transition');
      }),
    100,
  );

  container.addEventListener('click', async () => {
    if (status.textContent.includes('ting')) return;

    activeElements.forEach((el) => el.classList.add('processing'));

    const wasConnected = status.textContent === 'Connected';
    const currentActionBaseText = wasConnected ? 'Disconnecting' : 'Connecting';
    status.textContent = currentActionBaseText;

    const interval = setInterval(() => {
      const currentStatus = status.textContent;
      if (currentStatus.endsWith('ed') || currentStatus.includes('wrong')) clearInterval(interval);
      else if (currentStatus.endsWith('...')) status.textContent = currentActionBaseText;
      else status.textContent += '.';
    }, 250);

    await sleep(850);
    const error = await ToggleVPN(wasConnected, id);

    activeElements.forEach((el) => el.classList.remove('processing'));
    status.textContent = error ? 'Something went wrong' : wasConnected ? 'Disconnected' : 'Connected';
    if (!error) activeElements.forEach((el) => el.classList.toggle('active'));
  });
}

async function ToggleVPN(wasConnected, id) {
  if (wasConnected) {
    return await chrome.runtime.sendMessage({type: 'disconnect'});
  } else {
    const response = await request(`https://${origin}/extension-api/connect/${id}`, 'GET');
    if (!response?.username) return true;
    return await chrome.runtime.sendMessage({type: 'connect', ...response});
  }
}
