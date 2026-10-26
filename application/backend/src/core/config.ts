import {DEVELOPMENT_SECRET_SAUCE} from '@core/constants';

function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function resolveSecretSauce() {
  if (process.env.SECRET_SAUCE) {
    return process.env.SECRET_SAUCE;
  }

  if (!['dev', 'development', 'test'].includes(process.env.NODE_ENV || 'dev')) {
    return required('SECRET_SAUCE');
  }

  return DEVELOPMENT_SECRET_SAUCE;
}

const inProduction = ['prod', 'production'].includes(process.env.NODE_ENV || 'dev');
export const origin = process.env.APP_ORIGIN || (inProduction ? required('APP_ORIGIN') : 'http://localhost:5000');
export const onionOrigin = process.env.ONION_ORIGIN || '';
export const secretSauce = resolveSecretSauce();

if (inProduction && (secretSauce.length < 32 || /replace-with|placeholder|change.?me|synthetic/i.test(secretSauce))) {
  throw new Error('SECRET_SAUCE must contain a random production secret of at least 32 characters');
}

export const geminiApiKey = process.env.GEMINI_API_KEY || '';
export const geminiImageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
export const trocadorApiKey = process.env.TROCADOR_API_KEY || '';

export const dbConfig = {
  host: process.env.POSTGRES_HOST || (inProduction ? 'postgres' : 'localhost'),
  port: Number(process.env.POSTGRES_PORT || 5432),
  dbName: required('POSTGRES_DB'),
  username: 'shadowself_app',
  password: required('APP_DB_PASSWORD'),
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

const mailDomain = process.env.MAIL_DOMAIN || (inProduction ? required('MAIL_DOMAIN') : 'example.test');

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
