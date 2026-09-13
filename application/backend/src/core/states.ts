import {SENSITIVE_ATTEMPT_WINDOW, SENSITIVE_ATTEMPT_LIMIT} from '@core/constants';
import type {EmailCodePurpose, EmailCode, EmailDeliveryLimit, SignupDraft} from '@type';
import {hashVerification} from '@utils/cryptography';
import {randomInt, randomBytes} from 'node:crypto';
import {LOGIN_CHALLENGE_TTL, LOGIN_CHALLENGE_ATTEMPTS, LOGIN_CHALLENGE_CAPACITY} from '@core/constants';
import type {LoginChallenge, QueryUser} from '@type';
import type {CryptoFees, CryptoPrices, WSConnection, InvoiceConnection} from '@type';
import {error} from '@utils/utils';
import {
  EMAIL_CODE_TTL,
  EMAIL_CODE_ATTEMPTS,
  EMAIL_RESEND_INTERVAL,
  EMAIL_DELIVERY_WINDOW,
  EMAIL_DELIVERY_LIMIT,
  VERIFICATION_CAPACITY,
  SIGNUP_DRAFT_TTL,
} from '@core/constants';

export const billingReadiness = {lastSync: 0, priceSync: 0, available: false};

export const cryptoPrices = {} as CryptoPrices;
export const cryptoFees = {} as CryptoFees;

export let watchWallet: moneroTs.MoneroWalletFull;
export const setWatchWallet = (wallet: moneroTs.MoneroWalletFull) => (watchWallet = wallet);

const rateLimits = new Set<string>();
const cacheStore = new Map<string, any>();

export const throttle = (action: string, ms: number) => ({
  beforeHandle: ({identity, set}: any) => {
    if (!identity) return;

    const key = `${identity.id}:${action}`;
    if (rateLimits.has(key)) return error(set, 429, `Rate limit: Please wait ${ms / 1000}s`);

    rateLimits.add(key);
    setTimeout(() => rateLimits.delete(key), ms);
  },
});

export const useCache = (action: string, ms: number) => ({
  beforeHandle: ({identity}: any) => {
    if (!identity) return;
    const key = `${identity.id}:${action}`;
    if (cacheStore.has(key)) return cacheStore.get(key);
  },
  afterHandle: ({identity, response}: any) => {
    if (!identity) return;
    const key = `${identity.id}:${action}`;
    if (!cacheStore.has(key) && response) {
      cacheStore.set(key, response);
      setTimeout(() => cacheStore.delete(key), ms);
    }
  },
});

class WSManager {
  private connections = new Map<string, WSConnection>();

  set(id: string, connection: WSConnection) {
    this.connections.set(id, connection);
  }

  get(id: string) {
    return this.connections.get(id);
  }

  delete(id: string) {
    this.connections.delete(id);
  }

  values() {
    return Array.from(this.connections.values());
  }
}

class InvoiceManager {
  private connections = new Map<string, InvoiceConnection>();

  set(id: string, connection: InvoiceConnection) {
    this.connections.set(id, connection);
  }

  get(id: string) {
    return this.connections.get(id);
  }

  delete(id: string) {
    this.connections.delete(id);
  }

  values() {
    return Array.from(this.connections.values());
  }
}

export const wsConnections = new WSManager();
export const invoiceConnections = new InvoiceManager();

const loginChallenges = new Map<string, LoginChallenge>();

export function issueLoginChallenge(user: QueryUser) {
  if (!user.totp) return undefined;

  for (const [key, entry] of loginChallenges) {
    if (entry.expiresAt <= Date.now() || entry.email === user.email) loginChallenges.delete(key);
  }

  if (loginChallenges.size >= LOGIN_CHALLENGE_CAPACITY) return undefined;

  const challenge = randomBytes(32).toString('hex');
  loginChallenges.set(challenge, {
    email: user.email,
    password: user.password,
    totp: user.totp,
    expiresAt: Date.now() + LOGIN_CHALLENGE_TTL,
    attempts: 0,
    busy: false,
  });

  return {challenge, expiresIn: LOGIN_CHALLENGE_TTL / 1000};
}

export function claimLoginChallenge(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const entry = loginChallenges.get(value);
  if (!entry || entry.busy) return undefined;
  if (entry.expiresAt <= Date.now() || entry.attempts >= LOGIN_CHALLENGE_ATTEMPTS) {
    loginChallenges.delete(value);

    return undefined;
  }

  entry.attempts++;
  entry.busy = true;

  return entry;
}

export function finishLoginChallenge(value: string, entry: LoginChallenge, success: boolean) {
  const valid = loginChallenges.get(value) === entry && entry.expiresAt > Date.now();
  if (loginChallenges.get(value) === entry && (success || !valid || entry.attempts >= LOGIN_CHALLENGE_ATTEMPTS)) {
    loginChallenges.delete(value);
  }

  entry.busy = false;

  return valid;
}

export function issueEmailCode(purpose: EmailCodePurpose, email: string, binding: string) {
  const now = Date.now();
  for (const [key, entry] of emailCodes) if (entry.expiresAt <= now) emailCodes.delete(key);
  for (const [key, entry] of emailDeliveries) if (entry.expiresAt <= now) emailDeliveries.delete(key);

  const deliveryKey = email.toLowerCase();
  const limit = emailDeliveries.get(deliveryKey);
  if (limit && (limit.nextSend > now || limit.count >= EMAIL_DELIVERY_LIMIT)) return {status: 429 as const};
  if (emailCodes.size >= VERIFICATION_CAPACITY || emailDeliveries.size >= VERIFICATION_CAPACITY) return {status: 503 as const};

  emailDeliveries.set(deliveryKey, {
    expiresAt: limit?.expiresAt ?? now + EMAIL_DELIVERY_WINDOW,
    nextSend: now + EMAIL_RESEND_INTERVAL,
    count: (limit?.count ?? 0) + 1,
  });

  const key = JSON.stringify([purpose, email]);
  const code = randomInt(0, 100_000_000).toString().padStart(8, '0');
  emailCodes.set(key, {binding, hash: hashVerification(`${key}:${binding}:${code}`), expiresAt: now + EMAIL_CODE_TTL, attempts: 0});

  return {status: 200 as const, code};
}

export function consumeEmailCode(purpose: EmailCodePurpose, email: string, binding: string, code: unknown) {
  const key = JSON.stringify([purpose, email]);
  const entry = emailCodes.get(key);
  if (!entry || entry.binding !== binding) return false;

  entry.attempts++;

  const valid =
    entry.expiresAt > Date.now() &&
    entry.attempts <= EMAIL_CODE_ATTEMPTS &&
    typeof code === 'string' &&
    /^\d{8}$/.test(code) &&
    entry.hash === hashVerification(`${key}:${binding}:${code}`);
  if (valid || entry.expiresAt <= Date.now() || entry.attempts >= EMAIL_CODE_ATTEMPTS) emailCodes.delete(key);

  return valid;
}

export function discardEmailCode(purpose: EmailCodePurpose, email: string, binding: string, code: string) {
  const key = JSON.stringify([purpose, email]);
  if (emailCodes.get(key)?.hash === hashVerification(`${key}:${binding}:${code}`)) emailCodes.delete(key);
}

export function createSignupDraft(email: string, password: string) {
  for (const [key, entry] of signupDrafts) if (entry.expiresAt <= Date.now()) signupDrafts.delete(key);
  if (signupDrafts.size >= VERIFICATION_CAPACITY) return undefined;

  const id = randomBytes(32).toString('hex');
  signupDrafts.set(id, {
    email,
    password,
    expiresAt: Date.now() + SIGNUP_DRAFT_TTL,
    verified: false,
    username: '',
    secret: '',
    recoveryHashes: [],
  });

  return id;
}

export function getSignupDraft(id: unknown, consume = false) {
  if (typeof id !== 'string') return undefined;

  const entry = signupDrafts.get(id);
  if (consume || (entry && entry.expiresAt <= Date.now())) signupDrafts.delete(id);

  return entry && entry.expiresAt > Date.now() ? entry : undefined;
}

const emailCodes = new Map<string, EmailCode>();
const emailDeliveries = new Map<string, EmailDeliveryLimit>();
const signupDrafts = new Map<string, SignupDraft>();

const sensitiveAttempts = new Map<string, {count: number; expiresAt: number}>();

export function claimSensitiveAttempt(email: string) {
  for (const [key, entry] of sensitiveAttempts) {
    if (entry.expiresAt <= Date.now()) sensitiveAttempts.delete(key);
  }

  const entry = sensitiveAttempts.get(email) ?? {count: 0, expiresAt: Date.now() + SENSITIVE_ATTEMPT_WINDOW};
  if (entry.count >= SENSITIVE_ATTEMPT_LIMIT || (sensitiveAttempts.size >= VERIFICATION_CAPACITY && !sensitiveAttempts.has(email))) return false;

  entry.count++;
  sensitiveAttempts.set(email, entry);

  return true;
}
