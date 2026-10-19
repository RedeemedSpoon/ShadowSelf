export const ONION_ORIGIN = 'http://shadow7sk64geknoyyzsfyjm4rylnknx5pzhfhzkecoggowhitafggqd.onion';

export const DEVELOPMENT_SECRET_SAUCE = 'synthetic-development-secret-sauce-not-for-deployment';

export const IDENTITY_CREATION_AVAILABLE = false;

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
    title: 'Verify your email address',
    description: 'Enter this code in ShadowSelf to continue creating your account.',
    notice: 'If you did not start creating an account, you can ignore this message.',
  },
  change: {
    title: 'Verify your new email address',
    description: 'Enter this code in account settings to confirm your new email address.',
    notice: 'If you did not request this change, do not share the code. Your account email has not changed.',
  },
  recover: {
    title: 'Your sign-in code',
    description:
      'Enter this code on the ShadowSelf sign-in page. You may also need your authenticator or a recovery code.',
    notice: 'If you did not request a sign-in code, you can ignore this message.',
  },
};

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
