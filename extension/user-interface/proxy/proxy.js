document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const [id, location, proxy] = params.values();

  const place = location.split(', ')[1] + ', ' + location.split(', ')[2];

  document.getElementById('ip-address').textContent = proxy;
  document.getElementById('location').textContent = place;
});
