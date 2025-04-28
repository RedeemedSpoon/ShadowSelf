import {sleep, request, origin} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const [id, location, proxy] = params.values();

  const [country, ...place] = location.split(', ');
  const url = chrome.runtime.getURL(`assets/countries/${country.toLowerCase()}.svg`);

  document.getElementById('country-background').style.backgroundImage = `url("${url}")`;
  document.getElementById('ip-address').textContent = proxy.split('/')[0];
  document.getElementById('location').textContent = place.join(', ');

  await ConfigureVPN(id);

  const checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => {
    // Toggle kill switch
  });
});

async function ConfigureVPN(id) {
  const status = document.getElementById('status');
  const powerBtn = document.getElementById('power');
  const countryContainer = document.getElementById('country');
  const container = document.getElementById('button-container');
  const downloadSpeed = document.querySelector('#download .speed');
  const uploadSpeed = document.querySelector('#upload .speed');

  status.textContent = 'Disconnected';
  container.addEventListener('click', async () => {
    if (status.textContent.includes('ing')) return;

    [countryContainer, container, powerBtn].forEach((element) => {
      element.classList.add('processing');
    });

    const isConnected = status.textContent === 'Connected';
    status.textContent = isConnected ? 'Disconnecting' : 'Connecting';

    const interval = setInterval(() => {
      if (status.textContent.includes('ed') || status.textContent.includes('wrong')) clearInterval(interval);
      else if (status.textContent.includes('...')) status.textContent = isConnected ? 'Disconnecting' : 'Connecting';
      else status.textContent += '.';
    }, 300);

    await sleep(650);
    if (isConnected) {
      // do something
    } else {
      const response = await request(`https://${origin}/extension-api/connect/${id}`, 'GET');
      if (!response.username) return (status.textContent = 'Something went wrong');
      chrome.runtime.sendMessage({type: 'connect', response});
    }

    status.textContent = isConnected ? 'Disconnected' : 'Connected';
    [countryContainer, container, powerBtn].forEach((element) => {
      element.classList.remove('processing');
      element.classList.toggle('active');
    });

    // Calculate network speed
  });
}
