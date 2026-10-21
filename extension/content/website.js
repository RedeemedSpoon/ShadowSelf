const origin = new URL(chrome.runtime.getManifest().homepage_url).origin;

window.addEventListener('shadowself-extension-probe', () => {
  if (window === window.top && location.origin === origin) {
    window.dispatchEvent(new Event('shadowself-extension-ready'));
  }
});

window.addEventListener('message', async (event) => {
  if (
    window !== window.top ||
    location.origin !== origin ||
    event.source !== window ||
    event.origin !== origin ||
    event.data?.source !== 'shadowself-website' ||
    event.data?.type !== 'open-extension' ||
    typeof event.data.requestID !== 'string' ||
    !/^[a-f0-9-]{36}$/.test(event.data.requestID) ||
    !navigator.userActivation.isActive
  ) {
    return;
  }

  let opened = false;

  try {
    const response = await chrome.runtime.sendMessage({type: 'open-website-popup'});
    opened = response?.opened === true;
  } catch {}

  window.postMessage({source: 'shadowself-extension', requestID: event.data.requestID, opened}, origin);
});
