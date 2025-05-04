import {isChrome, read} from './shared.js';

export async function spoofUserAgent() {
  const userAgent = await getUserAgent();
  await updateRequestHeaders(userAgent);
}

export async function getUserAgent() {
  const actualAgent = await read('actualAgent');
  const agentBrowser = await read('agent-browser');
  const agentOS = await read('agent-os');

  return !actualAgent ? generateUserAgent(agentBrowser, agentOS) : null;
}

function generateUserAgent(agentBrowser, agentOS) {
  if (!agentBrowser || !agentOS) {
    return null;
  }

  // Versions might be outdated depending on date
  const chromeVersion = '120.0.0.0';
  const criosVersion = '120.0.6099.119';
  const firefoxVersion = '121.0';
  const fxiosVersion = '121.0';
  const firefoxRv = '115.0';
  const safariVersion = '17.2';
  const webkitVersion = '605.1.15';
  const edgeVersion = '120.0.2210.91';
  const edgiosVersion = '120.0.2210.84';
  const operaVersion = '105.0.4970.34';
  const operaTouchVersion = '73.2.3844.69820';
  const operaChromeVersion = '119.0.6045.199';

  if (agentOS === 'Windows') {
    const platform = 'Windows NT 10.0; Win64; x64';
    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case 'Firefox':
        return `Mozilla/5.0 (${platform}; rv:${firefoxRv}) Gecko/20100101 Firefox/${firefoxVersion}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36 Edg/${edgeVersion}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${operaChromeVersion} Safari/537.36 OPR/${operaVersion}`;
      case 'Safari':
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    }
  }

  if (agentOS === 'macOS') {
    const platform = 'Macintosh; Intel Mac OS X 10_15_7';
    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case 'Firefox':
        return `Mozilla/5.0 (${platform}; rv:${firefoxRv}) Gecko/20100101 Firefox/${firefoxVersion}`;
      case 'Safari':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} Safari/${webkitVersion}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36 Edg/${edgeVersion}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${operaChromeVersion} Safari/537.36 OPR/${operaVersion}`;
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} Safari/${webkitVersion}`;
    }
  }

  if (agentOS === 'Linux') {
    const platform = 'X11; Linux x86_64';
    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case 'Firefox':
        return `Mozilla/5.0 (${platform}; rv:${firefoxRv}) Gecko/20100101 Firefox/${firefoxVersion}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36 Edg/${edgeVersion}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${operaChromeVersion} Safari/537.36 OPR/${operaVersion}`;
      case 'Safari':
      default:
        return `Mozilla/5.0 (${platform}; rv:${firefoxRv}) Gecko/20100101 Firefox/${firefoxVersion}`;
    }
  }

  if (agentOS === 'ChromeOS') {
    const platform = 'X11; CrOS x86_64 14541.0.0';
    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case 'Firefox':
        return `Mozilla/5.0 (X11; CrOS x86_64 14541.0.0; rv:${firefoxRv}) Gecko/20100101 Firefox/${firefoxVersion}`;
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    }
  }

  if (agentOS === 'iPadOS') {
    const platform = `iPad; CPU OS 17_2 like Mac OS X`;
    const mobileSuffix = `Mobile/15E148 Safari/${webkitVersion}`;
    switch (agentBrowser) {
      case 'Safari':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} ${mobileSuffix}`;
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) CriOS/${criosVersion} ${mobileSuffix}`;
      case 'Firefox':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) FxiOS/${fxiosVersion} ${mobileSuffix}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/17.0 EdgiOS/${edgiosVersion} ${mobileSuffix}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/17.0 ${mobileSuffix} OPR/${operaTouchVersion}`;
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} ${mobileSuffix}`;
    }
  }

  if (agentOS === 'FireOS') {
    const platform = 'Linux; Android 11; KFSUWI Build/RTN1.210120.001';
    const mobileSuffix = 'Mobile Safari/537.36';
    const silkIdentifier = `Silk/120.2.1 like Chrome/${chromeVersion}`;
    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${chromeVersion} ${mobileSuffix} ${silkIdentifier}`;
      case 'Firefox':
        return `Mozilla/5.0 (Android 11; Mobile; rv:${firefoxRv}) Gecko/${firefoxRv} Firefox/${firefoxVersion}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} ${mobileSuffix} EdgA/${edgeVersion}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${operaChromeVersion} ${mobileSuffix} OPR/${operaVersion}`;
      default:
        return `Mozilla/5.0 (${platform}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${chromeVersion} ${mobileSuffix} ${silkIdentifier}`;
    }
  }

  if (agentOS === 'iOS') {
    const platform = `iPhone; CPU iPhone OS 17_2 like Mac OS X`;
    const mobileSuffix = `Mobile/15E148 Safari/${webkitVersion}`;
    switch (agentBrowser) {
      case 'Safari':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} ${mobileSuffix}`;
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) CriOS/${criosVersion} ${mobileSuffix}`;
      case 'Firefox':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) FxiOS/${fxiosVersion} ${mobileSuffix}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/17.0 EdgiOS/${edgiosVersion} ${mobileSuffix}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/17.0 ${mobileSuffix} OPR/${operaTouchVersion}`;
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} ${mobileSuffix}`;
    }
  }

  if (agentOS === 'Android') {
    const platform = 'Linux; Android 13; SM-G991U Build/TP1A.220624.014';
    const mobileSuffix = 'Mobile Safari/537.36';

    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} ${mobileSuffix}`;
      case 'Firefox':
        return `Mozilla/5.0 (Android 13; Mobile; rv:${firefoxRv}) Gecko/${firefoxRv} Firefox/${firefoxVersion}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} ${mobileSuffix} EdgA/${edgeVersion}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${operaChromeVersion} ${mobileSuffix} OPR/${operaVersion}`;
      case 'Safari':
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} ${mobileSuffix}`;
    }
  }

  if (agentOS === 'HarmonyOS') {
    const platform = 'Linux; Android 12; PPA-AL00 Build/HuaweiPPA-AL00';
    const harmonySuffix = `Mobile Safari/537.36 HMSCore/6.11.0.302 HuaweiBrowser/14.0.0.300 HarmonyOS/3.0.0`;
    switch (agentBrowser) {
      case 'Chrome':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} ${harmonySuffix}`;
      case 'Firefox':
        return `Mozilla/5.0 (Android 12; Mobile; rv:${firefoxRv}) Gecko/${firefoxRv} Firefox/${firefoxVersion}`;
      case 'Edge':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36 EdgA/${edgeVersion}`;
      case 'Opera':
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${operaChromeVersion} Mobile Safari/537.36 OPR/${operaVersion}`;
      default:
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} ${harmonySuffix}`;
    }
  }

  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

export async function updateRequestHeaders(newAgent) {
  const rule = {
    id: 1,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        {
          header: 'user-agent',
          operation: 'set',
          value: newAgent,
        },
      ],
    },
    condition: {
      urlFilter: '*://*/*',
      resourceTypes: [
        'main_frame',
        'sub_frame',
        'xmlhttprequest',
        'script',
        'image',
        'font',
        'object',
        'stylesheet',
        'media',
        'websocket',
      ],
    },
  };

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIdsToRemove = existingRules.map((r) => r.id);
  const rulesToAdd = newAgent ? [rule] : undefined;

  const browserAPI = isChrome ? chrome : browser;
  await browserAPI.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove,
    addRules: rulesToAdd,
  });
}
