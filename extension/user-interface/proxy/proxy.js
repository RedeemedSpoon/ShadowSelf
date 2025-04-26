document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const [id, location, proxy] = params.values();

  const [country, ...place] = location.split(', ');

  const url = chrome.runtime.getURL(`assets/countries/${country.toLowerCase()}.svg`);

  document.getElementById('country-background').style.backgroundImage = `url("${url}")`;
  document.getElementById('ip-address').textContent = proxy;
  document.getElementById('location').textContent = place.join(', ');
});
