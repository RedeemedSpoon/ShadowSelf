import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const inProduction = ['prod', 'production'].includes(process.env.NODE_ENV || 'dev');
export const origin = process.env.APP_ORIGIN || (inProduction ? 'https://shadowself.io' : 'http://localhost:5000');
export const secretSauce = required('SECRET_SAUCE');

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

export const twilioConfig = {
  sid: process.env.TWILIO_SID || '',
  token: process.env.TWILIO_TOKEN || '',
  messagingService: process.env.TWILIO_MESSAGING_SERVICE || '',
};

const configuredProxyIPs = (process.env.TRUSTED_PROXY_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);
const configuredProxyHosts = (process.env.TRUSTED_PROXY_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
export const trustedProxyIPs = [...configuredProxyIPs];

export async function resolveTrustedProxyHosts(
  hosts = configuredProxyHosts,
  resolver: (host: string) => Promise<{address: string}[]> = (host) => lookup(host, {all: true}),
) {
  const results = await Promise.allSettled(
    hosts.map(async (host) => {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(host)) {
        throw new Error('Invalid trusted proxy hostname');
      }

      return await resolver(host);
    }),
  );

  const current = [...configuredProxyIPs];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const {address} of result.value) {
        if (isIP(address) && !current.includes(address)) {
          current.push(address);
        }
      }
    } else {
      console.error('Trusted proxy lookup failed. Forwarded addresses will be ignored for that host until lookup recovers');
    }
  }

  trustedProxyIPs.splice(0, trustedProxyIPs.length, ...current);
}

export function refreshTrustedProxyHosts() {
  if (!configuredProxyHosts.length) {
    return;
  }

  return setInterval(() => {
    void resolveTrustedProxyHosts();
  }, 30_000).unref();
}
