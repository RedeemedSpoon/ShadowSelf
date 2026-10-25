import {PUBLIC_APP_ORIGIN, PUBLIC_ONION_ORIGIN, PUBLIC_MAIL_DOMAIN} from '$env/static/public';

export const APP_ORIGIN = PUBLIC_APP_ORIGIN;
export const API_BASE_URL = 'https://shadowself.io/api';
export const API_METHOD_COLORS: Record<string, string> = {
  GET: '#72b5a0',
  POST: '#86a9d2',
  PUT: '#c9ab72',
  PATCH: '#ad98c8',
  DELETE: '#c48c98',
  WS: 'var(--accent)',
};
export const SITE_HOST = new URL(APP_ORIGIN).host;
export const MAIL_DOMAIN = PUBLIC_MAIL_DOMAIN;
export const COIN_DECIMALS = {btc: 8, ltc: 8, eth: 18, usdt: 6, xmr: 12} as const;
export const CONTACT_EMAIL = `contact@${MAIL_DOMAIN}`;

export const ETHNICITIES = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
export const ONION_URL = PUBLIC_ONION_ORIGIN;
export const CRYPTO_DISCOUNT = 20;

export const PRICING_TIERS = {
  monthly: {
    title: 'Monthly Subscription',
    description: 'per month',
    price: 4.99,
  },

  annually: {
    title: 'Annual Subscription',
    description: 'per year',
    price: 49.99,
  },

  lifetime: {
    title: 'Lifetime Access',
    description: 'one time purchase',
    price: 199.99,
  },
};

export const HOMEPAGE_SERVICES = [
  {
    id: 'identity',
    icon: 'user',
    name: 'Identity',
    title: 'A profile of its own.',
    description: 'Generate a name, biography, location, and portrait, then edit the profile to suit the identity.',
    color: 'var(--feature-identity)',
  },
  {
    id: 'vault',
    icon: 'key',
    name: 'Account vault',
    title: 'Passwords and TOTP, per identity.',
    description:
      'Save website credentials under the profile that uses them. Unlock passwords and generate two-factor codes in your browser.',
    color: 'var(--feature-vault)',
  },
  {
    id: 'email',
    icon: 'mail',
    name: 'Email',
    title: 'An inbox of its own.',
    description:
      'Receive verification links and correspondence at a dedicated address. Reply, forward, save drafts, and send attachments from the workspace.',
    color: 'var(--feature-email)',
  },
  {
    id: 'phone',
    icon: 'phone',
    name: 'Phone',
    title: 'SMS under a separate number.',
    description:
      "Send and receive SMS with the identity's number. Verification codes and conversations stay with the accounts they're for.",
    color: 'var(--feature-phone)',
  },
  {
    id: 'wallet',
    icon: 'wallet',
    name: 'Wallet',
    title: 'Wallets under each identity.',
    description:
      'Receive Bitcoin, Litecoin, Ethereum, USDT, and Monero. Sign transfers in your browser and track balances and transactions per identity.',
    color: 'var(--feature-wallet)',
  },
  {
    id: 'card',
    icon: 'card',
    name: 'Credit card',
    title: 'A virtual card for online purchases.',
    description: 'Keep virtual card details, spending limits, and payment records with the identity that uses them.',
    color: 'var(--feature-card)',
  },
  {
    id: 'proxy',
    icon: 'proxy',
    name: 'Residential proxies',
    title: 'A connection for each identity.',
    description:
      'Manage residential proxy settings per identity and check provider status. A different IP address does not remove cookies or browser fingerprints.',
    color: 'var(--feature-proxy)',
  },
  {
    id: 'cloud',
    icon: 'cloud',
    name: 'Online drive',
    title: 'Files under each identity.',
    description:
      'Store identity files together. Inspect, remove, or edit image metadata and prepare pictures with watermarks and cloaking before sharing.',
    color: 'var(--feature-cloud)',
  },
] as const;

export const HOMEPAGE_DEMO_PROFILES = [
  {
    name: 'Camila Duarte',
    location: 'Brazil',
    email: 'camila.duarte@example.com',
    balance: '$1,284.60',
    accounts: 12,
    position: '0% 0%',
  },
  {
    name: 'Kenji Mori',
    location: 'Japan',
    email: 'kenji.mori@example.com',
    balance: '$738.25',
    accounts: 8,
    position: '50% 0%',
  },
  {
    name: 'Aisha Bello',
    location: 'United Kingdom',
    email: 'aisha.bello@example.com',
    balance: '$2,046.80',
    accounts: 16,
    position: '100% 0%',
  },
  {
    name: 'Matteo Conti',
    location: 'Italy',
    email: 'matteo.conti@example.com',
    balance: '$462.15',
    accounts: 6,
    position: '0% 100%',
  },
  {
    name: 'Leila Mansour',
    location: 'France',
    email: 'leila.mansour@example.com',
    balance: '$1,607.90',
    accounts: 11,
    position: '50% 100%',
  },
  {
    name: 'Arjun Mehta',
    location: 'India',
    email: 'arjun.mehta@example.com',
    balance: '$925.40',
    accounts: 9,
    position: '100% 100%',
  },
] as const;

export const HOMEPAGE_PANEL_IDENTITIES = {
  identity: {name: 'Yuna Choi', handle: 'yuna.frames', location: 'South Korea', email: 'yuna.frames@example.com'},
  vault: {name: 'Oliver Grant', handle: 'oliver.trails'},
  email: {name: 'Isabel Romero', email: 'isabel.romero@example.com'},
  phone: {name: 'Zara Okafor', phone: '+1 202 555 0142'},
  card: {name: 'Rafael Silva'},
  cloud: {name: 'Gabriel Costa'},
} as const;

export const CONTACT_CATEGORIES = [
  {value: 'question', label: 'Question'},
  {value: 'feedback', label: 'Feedback'},
  {value: 'collaboration', label: 'Collaboration'},
  {value: 'bug', label: 'Bug report'},
  {value: 'help', label: 'Account or payment'},
  {value: 'refund', label: 'Refund'},
  {value: 'other', label: 'Other'},
] as const;

export const EXTENSION_STORES = [
  {browser: 'Firefox', href: 'https://addons.mozilla.org/en-US/firefox/addon/shadowself'},
  {browser: 'Chrome', href: 'https://chromewebstore.google.com/detail/shadowself/paaidpbnnoopadhdodbjgfhfhhonmbmf'},
  {browser: 'Opera', href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'},
  {
    browser: 'Edge',
    href: 'https://microsoftedge.microsoft.com/addons/detail/shadowself/fjlfnbhdginnpjnlkhhbjhejgaamhdhb',
  },
] as const;

export const HOMEPAGE_CHAIN_LINK_PATH =
  'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71';

export const EXTENSION_ROUTE_PREVIEW = [
  {
    city: 'Amsterdam',
    country: 'Netherlands',
    code: 'NL',
    ip: '203.0.113.82',
    download: 84.6,
    upload: 32.8,
    latency: 24,
    longitude: 4.9041,
    latitude: 52.3676,
    viewLongitude: 25,
    labelX: 18,
  },
  {
    city: 'New York',
    country: 'United States',
    code: 'US',
    ip: '198.51.100.24',
    download: 62.4,
    upload: 24.6,
    latency: 78,
    longitude: -74.006,
    latitude: 40.7128,
    viewLongitude: -65,
    labelX: -18,
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    code: 'JP',
    ip: '192.0.2.146',
    download: 108.2,
    upload: 46.3,
    latency: 172,
    longitude: 139.6917,
    latitude: 35.6895,
    viewLongitude: 105,
    labelX: 18,
  },
] as const;

export const EXTENSION_SPEED_HISTORY = {
  samples: 26,
  interval: 700,
  width: 158,
  height: 64,
  ceilings: [
    Math.max(...EXTENSION_ROUTE_PREVIEW.map((route) => route.download)) * 1.2,
    Math.max(...EXTENSION_ROUTE_PREVIEW.map((route) => route.upload)) * 1.2,
  ],
} as const;

export const SEX_OPTIONS = [
  {value: 'male', label: 'Male'},
  {value: 'female', label: 'Female'},
] as const;

export const PAYMENT_ASSET_OPTIONS = [
  {value: 'xmr', label: 'Monero · Mainnet'},
  {value: 'btc', label: 'Bitcoin · Mainnet'},
  {value: 'ltc', label: 'Litecoin · Mainnet'},
  {value: 'eth', label: 'Ethereum · Mainnet'},
  {value: 'usdt', label: 'USDT · Ethereum ERC-20'},
] as const;

export const NETWORK_PRIORITY_OPTIONS = [
  {value: 'low', label: 'Low'},
  {value: 'medium', label: 'Medium'},
  {value: 'high', label: 'High'},
] as const;

export const TOTP_ALGORITHM_OPTIONS = ['SHA1', 'SHA256', 'SHA512'].map((value) => ({value, label: value}));

export const ERROR_PAGES = {
  404: {
    scene: 'orbit',
    label: 'Page not found',
    title: 'A little off course.',
    copy: "This page has drifted beyond our coordinates. Let's get you somewhere familiar.",
    centered: false,
  },
  403: {
    scene: 'jelly',
    label: 'Access denied',
    title: "That's classified. Apparently.",
    copy: "This page needs permissions your current session doesn't have.",
    centered: true,
  },
  500: {
    scene: 'coffee',
    label: 'Unexpected error',
    title: "Well. That wasn't in the plan.",
    copy: 'Something went wrong while loading this page. Give it another try.',
    centered: false,
  },
  503: {
    scene: 'break',
    label: 'Service unavailable',
    title: 'A brief intermission.',
    copy: 'The service is unavailable right now. Please try again in a little while.',
    centered: true,
  },
} as const;

export const ERROR_ILLUSTRATION_STARS = {
  orbit: [
    [30, 35, 3],
    [110, 22, 4.5],
    [239, 20, 1.2],
    [330, 48, 5],
    [337, 123, 1],
    [318, 218, 3.5],
    [230, 251, 2.5],
    [98, 250, 1.2],
    [25, 195, 4],
    [24, 104, 1.2],
    [53, 80, 1],
    [302, 22, 0.8],
  ],
  jelly: [
    [36, 46, 1.2],
    [99, 30, 5],
    [193, 23, 1],
    [281, 40, 3],
    [322, 88, 1.2],
    [310, 164, 5],
    [280, 230, 1],
    [207, 252, 3],
    [96, 240, 1.2],
    [39, 202, 4],
    [51, 129, 2.5],
    [144, 21, 0.8],
  ],
  coffee: [
    [40, 42, 4],
    [110, 53, 3],
    [155, 22, 1.2],
    [281, 25, 4.5],
    [315, 91, 1],
    [301, 160, 3],
    [327, 216, 1.2],
    [270, 248, 4],
    [91, 247, 2.5],
    [28, 178, 1.2],
    [46, 103, 1],
    [204, 252, 0.8],
  ],
  break: [
    [42, 45, 3.5],
    [119, 38, 4.5],
    [205, 26, 1],
    [298, 34, 3],
    [329, 101, 1.2],
    [326, 176, 4],
    [270, 249, 2.5],
    [189, 253, 1.2],
    [48, 241, 3],
    [25, 137, 1],
    [63, 84, 0.8],
    [250, 31, 1.2],
  ],
} as const;

export const SERVICE_GUIDES = {
  identity: {
    title: 'Identity profiles',
    introduction: 'Keep the profile and tools for each online persona together.',
    tools: [
      {name: 'Profile details', description: 'Generate and edit the name, biography, age, and location.'},
      {
        name: 'Profile pictures',
        description: 'Generate portraits and prepare pictures for the accounts using this identity.',
      },
      {
        name: 'Separate workspaces',
        description: 'Open an identity before using its contact details, credentials, payments, connection, or files.',
      },
    ],
    note: 'Profile locations and network exit locations are separate settings. A synthetic profile is not an official identity document.',
  },
  vault: {
    title: 'Account vault',
    introduction: 'Store each website login under the identity that owns it.',
    tools: [
      {
        name: 'Saved logins',
        description:
          'Save website addresses, usernames, passwords, and notes. Search and copy details when signing in.',
      },
      {
        name: 'Two-factor codes',
        description: 'Store TOTP secrets and generate current verification codes in your browser.',
      },
      {
        name: 'Recovery codes',
        description: 'Keep account recovery codes with the login so they are available when the authenticator is not.',
      },
    ],
    note: 'Unlock secrets with the identity master password. The account sign-in password does not decrypt the vault.',
  },
  email: {
    title: 'Email, aliases, and PGP',
    introduction: 'Handle verification messages and correspondence through a dedicated inbox.',
    tools: [
      {
        name: 'Messages and attachments',
        description: 'Read, send, reply, forward, and save drafts. Download attachments and organize mail.',
      },
      {
        name: 'Email aliases',
        description:
          'Use separate addresses for different accounts while keeping their messages in the same identity inbox.',
      },
      {
        name: 'PGP encryption',
        description: 'Manage encryption keys and exchange encrypted messages with contacts who use PGP.',
      },
    ],
    note: 'Ordinary mail is outside vault encryption. PGP protects the message contents you explicitly encrypt.',
  },
  phone: {
    title: 'Phone and SMS',
    introduction: 'Keep text conversations and verification messages under a separate number.',
    tools: [
      {
        name: 'Incoming messages',
        description: 'Read verification codes and incoming texts without switching to a personal phone number.',
      },
      {
        name: 'Conversations',
        description: 'Send and reply to SMS. Keep messages grouped by contact under the selected identity.',
      },
      {name: 'Message history', description: 'Review delivery status and manage the conversation history.'},
    ],
    note: 'Phone-number acceptance varies by website. Check acceptance before using the number as your only recovery method.',
  },
  wallet: {
    title: 'Cryptocurrency wallets',
    introduction: 'Manage Bitcoin, Litecoin, Ethereum, USDT on Ethereum, and Monero per identity.',
    tools: [
      {
        name: 'Send and receive',
        description: 'Generate receive addresses and QR codes, check network fees, and sign transfers in your browser.',
      },
      {
        name: 'Balances and history',
        description: 'Review balances, market values, confirmations, and transaction history for each asset.',
      },
      {
        name: 'Swaps and recovery',
        description: 'Exchange supported assets and recover interrupted payments using their saved references.',
      },
    ],
    note: 'Keep recovery phrases outside the service. Confirm the asset, network, recipient, and fee before signing a transfer.',
  },
  card: {
    title: 'Virtual cards',
    introduction: 'Keep online card payments and spending controls with the identity making the purchase.',
    tools: [
      {
        name: 'Card details',
        description: 'Manage virtual card details for online purchases and keep each card attached to its identity.',
      },
      {
        name: 'Spending controls',
        description: 'Set spending limits, review available funds, and freeze a card when it should not be used.',
      },
      {
        name: 'Payment history',
        description: 'Review purchases, declined payments, and refunds alongside the card they belong to.',
      },
    ],
    note: 'Identity virtual cards are separate from the payment card used to pay for a ShadowSelf subscription.',
  },
  proxy: {
    title: 'Residential proxies',
    introduction: 'Choose a residential exit location for browsing under this identity.',
    tools: [
      {
        name: 'Exit locations',
        description: 'Choose the country and available location for the residential connection.',
      },
      {
        name: 'Connection settings',
        description: 'Keep routing settings attached to the identity and use them through the browser extension.',
      },
      {
        name: 'Connection status',
        description: 'Check the current exit IP and connection status before using an account.',
      },
    ],
    note: 'A different exit IP does not remove cookies or browser fingerprints. Keep separate browser sessions for separate identities.',
  },
  cloud: {
    title: 'Online drive',
    introduction: 'Keep identity files together and prepare images before sharing them.',
    tools: [
      {
        name: 'Files and folders',
        description: 'Upload, organize, download, and remove files within the selected identity.',
      },
      {
        name: 'Image metadata',
        description: 'Inspect, remove, or edit embedded image metadata before exporting a copy.',
      },
      {
        name: 'Watermarks and cloaking',
        description: 'Apply a watermark or prepare a cloaked image, then review the exported result before sharing.',
      },
    ],
    note: 'Image processing cannot remove identifying details visible in the picture. Review faces, backgrounds, signs, and reflections yourself.',
  },
} as const;
