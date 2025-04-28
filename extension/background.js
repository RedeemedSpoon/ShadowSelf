chrome.runtime.onMessage.addListener(async (request) => {
  switch (request.type) {
    case 'connect':
      // do something
      break;

    case 'disconnect':
      // do something
      break;
  }
});
