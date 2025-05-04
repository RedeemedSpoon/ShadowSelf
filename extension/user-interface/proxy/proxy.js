import {sleep, read} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const [location, server, domain, protocol, port, username, password] = params.values();

  const [country, ...place] = location.split(', ');
  const url = chrome.runtime.getURL(`assets/countries/${country.toLowerCase()}.svg`);

  await ConfigureVPN(server, {server, protocol, port, username, domain, password});
  document.getElementById('country-background').style.backgroundImage = `url("${url}")`;
  document.getElementById('ip-address').textContent = server.split('/')[0];
  document.getElementById('location').textContent = place.join(', ');

  const killSwitch = await read('killSwitch');
  document.querySelector('input[type="checkbox"]').checked = killSwitch;
  getBandwidthSpeed();

  const checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({type: 'killSwitch', enabled: checkbox.checked});
  });
});

async function ConfigureVPN(proxy, response) {
  const status = document.getElementById('status');
  const powerBtn = document.getElementById('power');
  const countryContainer = document.getElementById('country');
  const container = document.getElementById('button-container');
  const activeElements = [countryContainer, container, powerBtn];

  const proxyConfig = await read('proxyConfig');
  if (proxyConfig?.ip === proxy) {
    status.textContent = 'Connected';
    activeElements.forEach((el) => el.classList.add('active'));
  }

  setTimeout(() => activeElements.forEach((element) => element.classList.add('transition')), 100);

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
    const error = await ToggleVPN(wasConnected, response);

    activeElements.forEach((el) => el.classList.remove('processing'));
    status.textContent = error ? 'Something went wrong' : wasConnected ? 'Disconnected' : 'Connected';

    if (!error) {
      activeElements.forEach((el) => el.classList.toggle('active'));
      if (!wasConnected) getBandwidthSpeed();
      else document.querySelectorAll('.speed').forEach((el) => (el.textContent = 'N/A'));
    }
  });
}

async function ToggleVPN(wasConnected, response) {
  if (wasConnected) return await chrome.runtime.sendMessage({type: 'disconnect'});
  else return await chrome.runtime.sendMessage({type: 'connect', ...response});
}

async function getBandwidthSpeed() {
  const download = document.querySelector('#download .speed');
  const upload = document.querySelector('#upload .speed');
  const isVPNEnabled = await read('isVPNEnabled');

  if (!isVPNEnabled) {
    download.textContent = 'N/A';
    upload.textContent = 'N/A';
    return;
  }

  download.textContent = '---';
  upload.textContent = '---';

  const downloadStart = performance.now();
  const downloadPromise = fetch('https://cachefly.cachefly.net/10mb.test', {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  const uploadStart = performance.now();
  const dataToUpload = new Blob([new Uint8Array(1024 * 1024)]);
  const uploadPromise = fetch('https://httpbin.org/post', {
    method: 'POST',
    cache: 'no-store',
    body: dataToUpload,
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  const responses = await Promise.all([downloadPromise, uploadPromise]);

  for (let i = 0; i < responses.length; i++) {
    let speed = 0;
    const element = i === 0 ? download : upload;
    const start = i === 0 ? downloadStart : uploadStart;
    const sizeBytes = i === 0 ? 10 * 1024 * 1024 : 1024 * 1024;

    if (responses[i] && responses[i].ok) {
      const end = performance.now();
      const duration = (end - start) / 1000;

      if (duration > 0) {
        speed = (sizeBytes * 8) / duration / 1000000;
        element.textContent = speed.toFixed(2);
      }
    }
  }
}
