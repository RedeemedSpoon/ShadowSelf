import {read} from '../../shared.js';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await read('auth');
  if (!auth) location.href = '../welcome/welcome.html';
});
