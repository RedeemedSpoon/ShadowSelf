export async function spoofUserAgent() {
  await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: [1]});
}
