import {isChrome, read} from '../shared.js';

const VERSION_BASELINE = Object.freeze({
  date: Date.UTC(2023, 11, 1),
  chromiumMajor: 120,
  firefoxMajor: 121,
  safariMajor: 17,
  iosMajor: 17,
  chromeOsBuild: 15699,
});

const RELEASE_CADENCE_DAYS = Object.freeze({
  chromium: 28,
  firefox: 28,
  safari: 365,
});

const BROWSERS = Object.freeze({
  chrome: 'Chrome',
  firefox: 'Firefox',
  safari: 'Safari',
  edge: 'Edge',
  opera: 'Opera',
});

const OPERATING_SYSTEMS = Object.freeze({
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  chromeos: 'ChromeOS',
  ipados: 'iPadOS',
  fireos: 'FireOS',
  ios: 'iOS',
  android: 'Android',
  harmonyos: 'HarmonyOS',
});

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
  const browser = normalizeBrowser(agentBrowser);
  const os = normalizeOS(agentOS);

  if (!browser || !os) {
    return null;
  }

  const versions = getUserAgentVersions();
  const builders = userAgentBuilders[os] || userAgentBuilders.Windows;
  const buildAgent = builders[browser] || builders.default;

  return buildAgent(versions);
}

function normalizeBrowser(agentBrowser) {
  return BROWSERS[String(agentBrowser || '').toLowerCase()];
}

function normalizeOS(agentOS) {
  return OPERATING_SYSTEMS[String(agentOS || '').toLowerCase()];
}

function getUserAgentVersions(date = new Date()) {
  const seed = Math.floor(date.getTime() / 86400000);
  const chromiumMajor = getReleaseMajor(date, VERSION_BASELINE.chromiumMajor, RELEASE_CADENCE_DAYS.chromium);
  const firefoxMajor = getReleaseMajor(date, VERSION_BASELINE.firefoxMajor, RELEASE_CADENCE_DAYS.firefox);
  const safariMajor = getReleaseMajor(date, VERSION_BASELINE.safariMajor, RELEASE_CADENCE_DAYS.safari);
  const chromiumBuild = 6000 + (chromiumMajor - VERSION_BASELINE.chromiumMajor) * 118 + dailyNumber(seed, 1, 0, 84);
  const chromiumPatch = dailyNumber(seed, 2, 37, 199);
  const operaMajor = Math.max(105, chromiumMajor - 15);
  const operaTouchMajor = Math.max(73, chromiumMajor - 47);

  return {
    chrome: `${chromiumMajor}.0.${chromiumBuild}.0`,
    crios: `${chromiumMajor}.0.${chromiumBuild}.${chromiumPatch}`,
    edge: `${chromiumMajor}.0.${chromiumBuild}.${dailyNumber(seed, 3, 30, 140)}`,
    edgios: `${chromiumMajor}.0.${chromiumBuild}.${dailyNumber(seed, 4, 30, 140)}`,
    firefox: `${firefoxMajor}.0`,
    firefoxRv: `${firefoxMajor}.0`,
    fxios: `${Math.max(121, firefoxMajor - 1)}.0`,
    opera: `${operaMajor}.0.${chromiumBuild - dailyNumber(seed, 5, 10, 90)}.${dailyNumber(seed, 6, 20, 90)}`,
    operaChrome: `${Math.max(120, chromiumMajor - 1)}.0.${chromiumBuild - dailyNumber(seed, 7, 20, 110)}.${dailyNumber(seed, 8, 40, 180)}`,
    operaTouch: `${operaTouchMajor}.${dailyNumber(seed, 9, 0, 4)}.${chromiumBuild}.${dailyNumber(seed, 10, 50000, 89999)}`,
    safari: `${safariMajor}.${dailyNumber(seed, 11, 0, 5)}`,
    webkit: '605.1.15',
    ios: `${Math.max(VERSION_BASELINE.iosMajor, safariMajor)}_${dailyNumber(seed, 12, 0, 5)}`,
    chromeOsBuild: `${VERSION_BASELINE.chromeOsBuild + (chromiumMajor - VERSION_BASELINE.chromiumMajor) * 76}.0.0`,
    silk: `${chromiumMajor}.${dailyNumber(seed, 13, 0, 4)}.1`,
    huaweiBrowser: `${Math.max(14, safariMajor - 3)}.0.0.${dailyNumber(seed, 14, 300, 360)}`,
  };
}

function getReleaseMajor(date, baselineMajor, cadenceDays) {
  const elapsedDays = Math.max(0, Math.floor((date.getTime() - VERSION_BASELINE.date) / 86400000));
  return baselineMajor + Math.floor(elapsedDays / cadenceDays);
}

function dailyNumber(seed, offset, min, max) {
  const value = Math.sin((seed + offset) * 9301) * 10000;
  const normalized = value - Math.floor(value);
  return Math.floor(normalized * (max - min + 1)) + min;
}

function chromiumDesktop(platform, versions, suffix = '') {
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versions.chrome} Safari/537.36${suffix}`;
}

function firefoxDesktop(platform, versions) {
  return `Mozilla/5.0 (${platform}; rv:${versions.firefoxRv}) Gecko/20100101 Firefox/${versions.firefox}`;
}

function safari(platform, versions) {
  return `Mozilla/5.0 (${platform}) AppleWebKit/${versions.webkit} (KHTML, like Gecko) Version/${versions.safari} Safari/${versions.webkit}`;
}

function chromiumMobile(platform, versions, suffix = '') {
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versions.chrome} Mobile Safari/537.36${suffix}`;
}

function firefoxMobile(androidVersion, versions) {
  return `Mozilla/5.0 (Android ${androidVersion}; Mobile; rv:${versions.firefoxRv}) Gecko/${versions.firefoxRv} Firefox/${versions.firefox}`;
}

function iosAgent(device, versions, browserToken = `Version/${versions.safari}`) {
  const platform = `${device}; CPU ${device === 'iPad' ? 'OS' : 'iPhone OS'} ${versions.ios} like Mac OS X`;
  const mobileSuffix = `Mobile/15E148 Safari/${versions.webkit}`;
  return `Mozilla/5.0 (${platform}) AppleWebKit/${versions.webkit} (KHTML, like Gecko) ${browserToken} ${mobileSuffix}`;
}

const userAgentBuilders = {
  Windows: {
    Chrome: (versions) => chromiumDesktop('Windows NT 10.0; Win64; x64', versions),
    Firefox: (versions) => firefoxDesktop('Windows NT 10.0; Win64; x64', versions),
    Edge: (versions) => chromiumDesktop('Windows NT 10.0; Win64; x64', versions, ` Edg/${versions.edge}`),
    Opera: (versions) =>
      chromiumDesktop('Windows NT 10.0; Win64; x64', {...versions, chrome: versions.operaChrome}, ` OPR/${versions.opera}`),
    default: (versions) => chromiumDesktop('Windows NT 10.0; Win64; x64', versions),
  },
  macOS: {
    Chrome: (versions) => chromiumDesktop('Macintosh; Intel Mac OS X 10_15_7', versions),
    Firefox: (versions) => firefoxDesktop('Macintosh; Intel Mac OS X 10_15_7', versions),
    Safari: (versions) => safari('Macintosh; Intel Mac OS X 10_15_7', versions),
    Edge: (versions) => chromiumDesktop('Macintosh; Intel Mac OS X 10_15_7', versions, ` Edg/${versions.edge}`),
    Opera: (versions) =>
      chromiumDesktop('Macintosh; Intel Mac OS X 10_15_7', {...versions, chrome: versions.operaChrome}, ` OPR/${versions.opera}`),
    default: (versions) => safari('Macintosh; Intel Mac OS X 10_15_7', versions),
  },
  Linux: {
    Chrome: (versions) => chromiumDesktop('X11; Linux x86_64', versions),
    Firefox: (versions) => firefoxDesktop('X11; Linux x86_64', versions),
    Edge: (versions) => chromiumDesktop('X11; Linux x86_64', versions, ` Edg/${versions.edge}`),
    Opera: (versions) => chromiumDesktop('X11; Linux x86_64', {...versions, chrome: versions.operaChrome}, ` OPR/${versions.opera}`),
    default: (versions) => firefoxDesktop('X11; Linux x86_64', versions),
  },
  ChromeOS: {
    Chrome: (versions) => chromiumDesktop(`X11; CrOS x86_64 ${versions.chromeOsBuild}`, versions),
    Firefox: (versions) => firefoxDesktop(`X11; CrOS x86_64 ${versions.chromeOsBuild}`, versions),
    default: (versions) => chromiumDesktop(`X11; CrOS x86_64 ${versions.chromeOsBuild}`, versions),
  },
  iPadOS: {
    Safari: (versions) => iosAgent('iPad', versions),
    Chrome: (versions) => iosAgent('iPad', versions, `CriOS/${versions.crios}`),
    Firefox: (versions) => iosAgent('iPad', versions, `FxiOS/${versions.fxios}`),
    Edge: (versions) => iosAgent('iPad', versions, `Version/${versions.safari} EdgiOS/${versions.edgios}`),
    Opera: (versions) => iosAgent('iPad', versions, `Version/${versions.safari} OPR/${versions.operaTouch}`),
    default: (versions) => iosAgent('iPad', versions),
  },
  FireOS: {
    Chrome: (versions) =>
      `Mozilla/5.0 (Linux; Android 11; KFSUWI Build/RTN1.210120.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${versions.chrome} Mobile Safari/537.36 Silk/${versions.silk} like Chrome/${versions.chrome}`,
    Firefox: (versions) => firefoxMobile(11, versions),
    Edge: (versions) => chromiumMobile('Linux; Android 11; KFSUWI Build/RTN1.210120.001', versions, ` EdgA/${versions.edge}`),
    Opera: (versions) =>
      chromiumMobile(
        'Linux; Android 11; KFSUWI Build/RTN1.210120.001',
        {...versions, chrome: versions.operaChrome},
        ` OPR/${versions.opera}`,
      ),
    default: (versions) =>
      `Mozilla/5.0 (Linux; Android 11; KFSUWI Build/RTN1.210120.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${versions.chrome} Mobile Safari/537.36 Silk/${versions.silk} like Chrome/${versions.chrome}`,
  },
  iOS: {
    Safari: (versions) => iosAgent('iPhone', versions),
    Chrome: (versions) => iosAgent('iPhone', versions, `CriOS/${versions.crios}`),
    Firefox: (versions) => iosAgent('iPhone', versions, `FxiOS/${versions.fxios}`),
    Edge: (versions) => iosAgent('iPhone', versions, `Version/${versions.safari} EdgiOS/${versions.edgios}`),
    Opera: (versions) => iosAgent('iPhone', versions, `Version/${versions.safari} OPR/${versions.operaTouch}`),
    default: (versions) => iosAgent('iPhone', versions),
  },
  Android: {
    Chrome: (versions) => chromiumMobile('Linux; Android 13; SM-G991U Build/TP1A.220624.014', versions),
    Firefox: (versions) => firefoxMobile(13, versions),
    Edge: (versions) => chromiumMobile('Linux; Android 13; SM-G991U Build/TP1A.220624.014', versions, ` EdgA/${versions.edge}`),
    Opera: (versions) =>
      chromiumMobile(
        'Linux; Android 13; SM-G991U Build/TP1A.220624.014',
        {...versions, chrome: versions.operaChrome},
        ` OPR/${versions.opera}`,
      ),
    default: (versions) => chromiumMobile('Linux; Android 13; SM-G991U Build/TP1A.220624.014', versions),
  },
  HarmonyOS: {
    Chrome: (versions) =>
      chromiumMobile(
        'Linux; Android 12; PPA-AL00 Build/HuaweiPPA-AL00',
        versions,
        ` HMSCore/6.11.0.302 HuaweiBrowser/${versions.huaweiBrowser} HarmonyOS/3.0.0`,
      ),
    Firefox: (versions) => firefoxMobile(12, versions),
    Edge: (versions) => chromiumMobile('Linux; Android 12; PPA-AL00 Build/HuaweiPPA-AL00', versions, ` EdgA/${versions.edge}`),
    Opera: (versions) =>
      chromiumMobile(
        'Linux; Android 12; PPA-AL00 Build/HuaweiPPA-AL00',
        {...versions, chrome: versions.operaChrome},
        ` OPR/${versions.opera}`,
      ),
    default: (versions) =>
      chromiumMobile(
        'Linux; Android 12; PPA-AL00 Build/HuaweiPPA-AL00',
        versions,
        ` HMSCore/6.11.0.302 HuaweiBrowser/${versions.huaweiBrowser} HarmonyOS/3.0.0`,
      ),
  },
};

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

  const browserAPI = isChrome ? chrome : browser;
  const existingRules = await browserAPI.declarativeNetRequest.getDynamicRules();
  const ruleIdsToRemove = existingRules.map((r) => r.id);
  const rulesToAdd = newAgent ? [rule] : undefined;

  await browserAPI.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove,
    addRules: rulesToAdd,
  });
}
