export const DEVELOPMENT_SECRET_SAUCE = 'synthetic-development-secret-sauce-not-for-deployment';

export const IDENTITY_CREATION_AVAILABLE = false;

export const ETHNICITIES = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
export const EMAIL_JUNK_RETENTION_DAYS = 7;
export const EMAIL_FETCH_LIMIT = 10;
export const EMAIL_UID_WINDOW = 1000;
export const EMAIL_OUTBOUND_HOURLY_LIMIT = 30;
export const EMAIL_CONNECTION_LIMIT = 128;
export const EMAIL_MAILBOX_CONNECTION_LIMIT = 4;
export const SOCKET_CONNECTION_LIMIT = 96;
export const SOCKET_ACCOUNT_CONNECTION_LIMIT = 8;
export const SOCKET_MAILBOX_CONNECTION_LIMIT = 2;
export const SMS_MAX_LENGTH = 160;

export const SWAP_API = 'https://api.trocador.app';
export const SWAP_CHECKOUT_URL = 'https://trocador.app/en/checkout';
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

export const PAYMENT_WINDOW_MIN = 40;
export const CRYPTO_DISCOUNT = 20;
export const BILLING_CURRENCY = 'usd';
export const CRYPTO_REFUND_CONFIRMATIONS = 10;
export const REFUND_WINDOW_MS = 14 * 86_400_000;
export const STRIPE_EVENT_RETENTION_DAYS = 30;
export const STRIPE_EVENT_TYPES = [
  'payment_intent.succeeded',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
  'customer.subscription.deleted',
  'refund.created',
  'refund.updated',
  'refund.failed',
] as const;
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

export const SIGNUP_PREVIOUS_STAGE = {
  account: undefined,
  email: 'account',
  username: 'email',
  security: 'username',
  authenticator: 'security',
  recovery: 'authenticator',
  complete: 'security',
} as const;

export const SOCKET_AUTH_INTERVAL = 5000;

export const SENSITIVE_ATTEMPT_WINDOW = 300_000;
export const SENSITIVE_ATTEMPT_LIMIT = 10;

export const SWAP_NETWORKS: Record<string, string> = {
  btc: 'Mainnet',
  ltc: 'Mainnet',
  eth: 'Mainnet',
  usdt: 'ERC20',
  xmr: 'Mainnet',
};

export const CHAIN_REQUEST_TIMEOUT_MS = 6_000;
export const CHAIN_PROVIDER_COOLDOWN_MS = 30_000;
export const WALLET_HISTORY_PAGE_SIZE = 50;
export const ESPLORA_HISTORY_PAGE_SIZE = 25;

export const BILLING_RECEIPT_BATCH_SIZE = 10;
export const BILLING_RECEIPT_RETRY_MS = 60_000;
export const BILLING_RECEIPT_MAX_RETRY_MS = 86_400_000;

export const BILLING_PLAN_LABELS = {monthly: 'Monthly', annually: 'Annual', lifetime: 'Lifetime'} as const;

export const BILLING_RECEIPT_NOTICE =
  'This receipt covers identity access. Network fees and separately billed usage are not included.';
