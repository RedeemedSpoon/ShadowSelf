function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  else return value;
}

export const inProduction = getEnv('NODE_ENV') === 'prod';
export const origin = getEnv('NODE_ENV') === 'dev' ? 'https://localhost' : 'https://shadowself.io';

export const jwtSecret = getEnv('JWT_SECRET');
export const secretSauce = getEnv('SECRET_SAUCE');
export const secretProxyKey = getEnv('SECRET_PROXY_KEY');

export const geminiApiKey = getEnv('GEMINI_API_KEY');
export const trocadorApiKey = getEnv('TROCADOR_API_KEY');

export const dbConfig = {
  dbName: getEnv('POSTGRES_DB'),
  username: getEnv('POSTGRES_USER'),
  password: getEnv('POSTGRES_PASSWORD'),
};

export const moneroWallet = {
  address: getEnv('MONERO_ADDRESS'),
  viewKey: getEnv('MONERO_VIEWKEY'),
  password: getEnv('MONERO_PASSWORD'),
};

export const emailConfig = {
  contactPassword: getEnv('EMAIL_CONTACT'),
  verificationPassword: getEnv('EMAIL_VERIFICATION'),
};

export const stripeConfig = {
  secretKey: getEnv('STRIPE_SECRET_KEY'),
  webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
  prices: {
    monthly: getEnv('MONTHLY_PRICE_ID'),
    annually: getEnv('ANNUALLY_PRICE_ID'),
    lifetime: getEnv('LIFETIME_PRICE_ID'),
  },
};

export const twilioConfig = {
  sid: getEnv('TWILIO_SID'),
  token: getEnv('TWILIO_TOKEN'),
  messagingService: getEnv('TWILIO_MESSAGING_SERVICE'),
};
