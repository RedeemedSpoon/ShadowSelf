import {randomBytes} from 'node:crypto';
import {LOGIN_CHALLENGE_TTL, LOGIN_CHALLENGE_ATTEMPTS, LOGIN_CHALLENGE_CAPACITY} from '@core/constants';
import type {LoginChallenge, QueryUser} from '@type';
import type {CryptoFees, CryptoPrices, WSConnection, InvoiceConnection} from '@type';
import {error} from '@utils/utils';

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
