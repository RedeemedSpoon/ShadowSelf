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
