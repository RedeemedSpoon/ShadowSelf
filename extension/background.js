chrome.runtime.onMessage.addListener(async (request) => {
  switch (request.type) {
    case 'connect': {
      const {server, protocol, port, username, password} = request;
      const config = {
        mode: 'fixed_servers',
        proxyRules: {
          singleProxy: {
            scheme: protocol,
            host: server,
            port: port,
          },
          bypassList: [],
        },
      };

      chrome.proxy.settings.set({value: config, scope: 'regular'});
      break;
    }

    case 'disconnect': {
      // do something
      break;
    }
  }
});
