export const ETHNICITIES = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
export const EMAIL_JUNK_RETENTION_DAYS = 7;
export const EMAIL_FETCH_LIMIT = 10;
export const SMS_MAX_LENGTH = 160;

export const BTC_API = 'https://mempool.space/api';
export const LTC_API = 'https://litecoinspace.org/api';
export const ETH_API = 'https://eth.blockscout.com/api';
export const XMR_NODE = 'https://xmr-node.cakewallet.com:18081/json_rpc';
export const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,litecoin,ethereum,tether,monero&sparkline=true';

export const POLL_INVOICES_INTERVAL = 15_000; // every 15 seconds
export const POLL_PRICES_INTERVAL = 60_000; // every 60 seconds
export const POLL_FEES_INTERVAL = 120_000; // every 2 minutes

export const UTXO_GAP_LIMIT = 5;
export const UTXO_HARD_LIMIT = 120;
export const RESTORE_HEIGHT = 3_600_000;

export const PAYMENT_WINDOW_MIN = 40;
export const CRYPTO_DISCOUNT = 20;
export const PRICING_TIERS = {
  monthly: 500,
  annually: 5000,
  lifetime: 20000,
};

export const EMAIL_TEMPLATES = {
  confirm: {
    title: 'Confirm Your Email Address',
    description: 'Thank you for signing up for Shadowself. To create your account, you need to first verify your email address.',
    type: 'access',
    action: 'create your account & start using Shadowself',
  },
  change: {
    title: 'Change Your Email Address',
    description: 'To change the email address associated with your account, you need to first verify this new email address.',
    type: 'access',
    action: 'login to your account with the new email address',
  },
  recover: {
    title: 'Recover Your Account',
    description: 'Since you forgot your password, we will resort to using recovery token to get back your account.',
    type: 'recovery',
    action: 'login to your account & start using Shadowself',
  },
};

export const LOCATIONS = [
  {
    country: 'United States',
    code: 'US',
    city: 'Seattle',
    localization: 'en_US',
    ip: '91.240.75.212',
    map: 'https://osm.org/go/WIXvEZp-',
  },
  {
    country: 'Canada',
    code: 'CA',
    city: 'Toronto',
    localization: 'en_CA',
    ip: '24.68.162.126',
    map: 'https://osm.org/go/ZX6E86v-',
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    city: 'London',
    localization: 'en_GB',
    ip: '153.869.12.56',
    map: 'https://osm.org/go/euunRP',
  },
];
