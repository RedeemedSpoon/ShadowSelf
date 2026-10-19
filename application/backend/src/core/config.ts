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
export const origin = process.env.APP_ORIGIN || (inProduction ? 'https://shadowself.io' : 'http://localhost:5000');
export const secretSauce = resolveSecretSauce();

if (inProduction && (secretSauce.length < 32 || /replace-with|placeholder|change.?me|synthetic/i.test(secretSauce))) {
  throw new Error('SECRET_SAUCE must contain a random production secret of at least 32 characters');
}

export const cryptoBillingEnabled = process.env.CRYPTO_BILLING_ENABLED !== 'false';
export const geminiApiKey = process.env.GEMINI_API_KEY || '';
export const trocadorApiKey = process.env.TROCADOR_API_KEY || '';

export const dbConfig = {
  host: process.env.POSTGRES_HOST || (inProduction ? 'postgres' : 'localhost'),
  port: Number(process.env.POSTGRES_PORT || 5432),
  dbName: required('POSTGRES_DB'),
  username: process.env.APP_DB_USER || 'shadowself_app',
  password: required('APP_DB_PASSWORD'),
};

export const moneroWallet = {
  address: process.env.MONERO_ADDRESS || '',
  viewKey: process.env.MONERO_VIEWKEY || '',
  password: process.env.MONERO_PASSWORD || '',
};

export const emailConfig = {
  host: process.env.MAIL_HOST || '',
  contactPassword: process.env.EMAIL_CONTACT || '',
  verificationPassword: process.env.EMAIL_VERIFICATION || '',
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
