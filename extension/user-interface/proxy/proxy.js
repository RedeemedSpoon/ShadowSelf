document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const [id, location, proxy] = params.values();

  const [country, ...place] = location.split(', ');
  const url = chrome.runtime.getURL(`assets/countries/${country.toLowerCase()}.svg`);

  document.getElementById('country-background').style.backgroundImage = `url("${url}")`;
  document.getElementById('ip-address').textContent = proxy.split('/')[0];
  document.getElementById('location').textContent = place.join(', ');

  await ConfigureVPN();
});

async function ConfigureVPN() {
  const status = document.getElementById('status');
  const powerBtn = document.getElementById('power');
  const container = document.getElementById('button-container');
  const countryContainer = document.getElementById('country');

  status.textContent = 'Disconnected';
  powerBtn.addEventListener('click', async () => {
    if (status.textContent.includes('ing')) return;

    powerBtn.classList.add('processing');
    container.classList.add('processing');
    countryContainer.classList.add('processing');

    const isConnected = status.textContent === 'Connected';
    status.textContent = isConnected ? 'Disconnecting' : 'Connecting';

    const interval = setInterval(() => {
      if (status.textContent.includes('...')) status.textContent = isConnected ? 'Disconnecting' : 'Connecting';
      else status.textContent += '.';
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      status.textContent = isConnected ? 'Disconnected' : 'Connected';

      countryContainer.classList.remove('processing');
      container.classList.remove('processing');
      powerBtn.classList.remove('processing');

      countryContainer.classList.toggle('active');
      container.classList.toggle('active');
      powerBtn.classList.toggle('active');
    }, 1200);
  });
}
