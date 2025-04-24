import {read} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cookie = await read('cookie');
  if (!cookie) location.href = '../welcome/welcome.html';
});
