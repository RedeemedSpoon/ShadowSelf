import {log} from '@logging';
import {DEFAULT_SECRET_SAUCE} from '@core/constants';

const inProduction = ['prod', 'production'].includes(process.env.NODE_ENV || 'dev');

export const origin = process.env.APP_ORIGIN || 'http://localhost:5000';
export const onionOrigin = process.env.ONION_ORIGIN || '';
export const billingEnabled = process.env.ENABLE_BILLING === 'true';
export const secretSauce = process.env.SECRET_SAUCE || DEFAULT_SECRET_SAUCE;

export const geminiApiKey = process.env.GEMINI_API_KEY || '';
export const geminiImageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
export const trocadorApiKey = process.env.TROCADOR_API_KEY || '';

export const dbConfig = {
  host: process.env.POSTGRES_HOST || (inProduction ? 'postgres' : 'localhost'),
  port: Number(process.env.POSTGRES_PORT || 5432),
  dbName: process.env.POSTGRES_DB || 'shadowself',
  username: 'shadowself_app',
  password: process.env.APP_DB_PASSWORD || '',
};

const moneroRestoreHeight = Number(process.env.MONERO_RESTORE_HEIGHT || '0');

if (!Number.isSafeInteger(moneroRestoreHeight) || moneroRestoreHeight < 0) {
  throw new Error('MONERO_RESTORE_HEIGHT must be a nonnegative integer');
}

export const moneroWallet = {
  address: process.env.MONERO_ADDRESS || '',
  viewKey: process.env.MONERO_VIEWKEY || '',
  spendKey: process.env.MONERO_SPENDKEY || '',
  restoreHeight: moneroRestoreHeight,
  password: process.env.MONERO_PASSWORD || '',
};

const mailDomain = process.env.MAIL_DOMAIN || 'example.test';

export const emailConfig = {
  host: process.env.MAIL_HOST || '',
  domain: mailDomain,
  contactAddress: `contact@${mailDomain}`,
  verificationAddress: `verification@${mailDomain}`,
  billingAddress: `billing@${mailDomain}`,
  contactPassword: process.env.EMAIL_CONTACT || '',
  verificationPassword: process.env.EMAIL_VERIFICATION || '',
  billingPassword: process.env.EMAIL_BILLING || '',
};

function providerEndpoints(name: string) {
  const values = [process.env[name], process.env[`${name}_FALLBACKS`]].filter(Boolean).join(',');

  return [
    ...new Set(
      values
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => {
          const url = new URL(value);

          if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
            throw new Error(`${name} must contain HTTPS endpoints without credentials or fragments`);
          }

          return url.href.replace(/\/$/, '');
        }),
    ),
  ];
}

export const chainEndpoints = {
  btc: providerEndpoints('BTC_API'),
  ltc: providerEndpoints('LTC_API'),
  eth: providerEndpoints('ETH_API'),
  ethRpc: providerEndpoints('ETH_RPC_URLS'),
  xmr: providerEndpoints('XMR_NODE'),
};

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  prices: {
    monthly: process.env.MONTHLY_PRICE_ID || '',
    annually: process.env.ANNUALLY_PRICE_ID || '',
    lifetime: process.env.LIFETIME_PRICE_ID || '',
  },
};

export function warnMissingConfiguration() {
  const defaults = [
    ['APP_ORIGIN', 'using http://localhost:5000'],
    ['POSTGRES_DB', 'using database shadowself'],
    ['MAIL_DOMAIN', 'using example.test'],
    ['SECRET_SAUCE', 'using the insecure development default'],
  ];

  for (const [key, message] of defaults) {
    if (!process.env[key]) {
      log('warn', `Config: ${key} unset; ${message}`);
    }
  }

  const services: [string, string[]][] = [
    ['Database', ['APP_DB_PASSWORD']],
    ['Portrait generation', ['GEMINI_API_KEY']],
    ['Crypto exchange', ['TROCADOR_API_KEY']],
    ['Contact email', ['MAIL_HOST', 'MAIL_DOMAIN', 'EMAIL_CONTACT']],
    ['Verification email', ['MAIL_HOST', 'MAIL_DOMAIN', 'EMAIL_VERIFICATION']],
    ['Billing email', ['MAIL_HOST', 'MAIL_DOMAIN', 'EMAIL_BILLING']],
    ['Card billing', ['STRIPE_SECRET_KEY', 'MONTHLY_PRICE_ID', 'ANNUALLY_PRICE_ID', 'LIFETIME_PRICE_ID']],
    ['Card billing webhooks', ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']],
    ['Crypto billing', ['MONERO_ADDRESS', 'MONERO_VIEWKEY', 'MONERO_SPENDKEY', 'MONERO_PASSWORD', 'XMR_NODE']],
    ['Bitcoin provider', ['BTC_API']],
    ['Litecoin provider', ['LTC_API']],
    ['Ethereum explorer', ['ETH_API']],
    ['Ethereum RPC', ['ETH_RPC_URLS']],
    ['Monero node', ['XMR_NODE']],
  ];

  for (const [service, keys] of services) {
    const missing = keys.filter((key) => !process.env[key] && !process.env[`${key}_FALLBACKS`]);

    if (missing.length) {
      log('warn', `Config: ${service} off; missing ${missing.join(', ')}`);
    }
  }
}
