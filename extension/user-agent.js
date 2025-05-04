import {isChrome, read} from './shared.js';

export async function spoofUserAgent() {
  const userAgent = await getUserAgent();
  await updateRequestHeaders(userAgent);
}

export async function getUserAgent() {
  const actualAgent = await read('actualAgent');
  const agentBrowser = await read('agent-browser');
  const agentOS = await read('agent-device');

  return !actualAgent ? `${agentOS} ${agentBrowser}` : null;
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
