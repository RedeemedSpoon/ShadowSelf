document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('actual-user-agent').textContent = navigator.userAgent;
  await chrome.runtime.sendMessage({type: 'userAgent'});
});
