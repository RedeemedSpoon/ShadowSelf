export const ETHNICITIES = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
export const EMAIL_JUNK_RETENTION_DAYS = 7;
export const EMAIL_FETCH_LIMIT = 10;
export const SMS_MAX_LENGTH = 160;
export const SMS_PAGE_SIZE = 30;
export const SMS_DELETE_CONCURRENCY = 4;

export const BTC_API = 'https://mempool.space/api';
export const LTC_API = 'https://litecoinspace.org/api';
export const ETH_API = 'https://eth.blockscout.com/api';
export const XMR_NODE = 'https://xmr-node.cakewallet.com:18081/json_rpc';
export const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,litecoin,ethereum,tether,monero&sparkline=true';

export const POLL_CLEANUP_INTERVAL = 3_600_000;
export const POLL_INVOICES_INTERVAL = 15_000;
export const POLL_PRICES_INTERVAL = 60_000;
export const POLL_FEES_INTERVAL = 120_000;

export const UTXO_GAP_LIMIT = 20;
export const UTXO_HARD_LIMIT = 120;
export const UTXO_RECOVERY_LIMIT = 1200;
export const CHAIN_REQUEST_CONCURRENCY = 6;
export const INVOICE_POLL_BATCH_SIZE = 100;
export const INVOICE_ACTIVE_MONITOR_MS = 7 * 86_400_000;
export const RESTORE_HEIGHT = 3_600_000;

export const PAYMENT_WINDOW_MIN = 40;
export const CRYPTO_DISCOUNT = 20;
export const BILLING_CURRENCY = 'usd';
export const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const PRICING_TIERS = {
  monthly: 499,
  annually: 4999,
  lifetime: 19999,
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
    map: 'https://osm.org/go/WIXvEZp-',
  },
  {
    country: 'Canada',
    code: 'CA',
    city: 'Toronto',
    localization: 'en_CA',
    map: 'https://osm.org/go/ZX6E86v-',
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    city: 'London',
    localization: 'en_GB',
    map: 'https://osm.org/go/euunRP',
  },
];

export const LOGIN_CHALLENGE_TTL = 300_000;
export const LOGIN_CHALLENGE_ATTEMPTS = 5;
export const LOGIN_CHALLENGE_CAPACITY = 10_000;

export const EMAIL_CODE_TTL = 600_000;
export const EMAIL_CODE_ATTEMPTS = 5;
export const EMAIL_RESEND_INTERVAL = 60_000;
export const EMAIL_DELIVERY_WINDOW = 3_600_000;
export const EMAIL_DELIVERY_LIMIT = 5;
export const VERIFICATION_CAPACITY = 10_000;
export const SIGNUP_DRAFT_TTL = 1_800_000;

export const SOCKET_AUTH_INTERVAL = 5000;

export const SENSITIVE_ATTEMPT_WINDOW = 300_000;
export const SENSITIVE_ATTEMPT_LIMIT = 10;
