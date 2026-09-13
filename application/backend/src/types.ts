import type {ElysiaWS} from 'elysia/ws';

export type User = {email: string; id: string} | undefined;

export type SessionJwt = {verify: (token?: string) => Promise<unknown>};

export type Attachment = {filename: string; data: string};

export type CryptoCurrencies = 'btc' | 'ltc' | 'eth' | 'usdt' | 'xmr';

export interface WSConnection {
  stopEmail: () => void;
  websocket: ElysiaWS;
  authorize: () => Promise<boolean>;
  authTimer: ReturnType<typeof setInterval>;
  phoneNumber: string;
  emailAddress: string;
}

export interface InvoiceConnection {
  websocket: ElysiaWS;
  authorize: () => Promise<boolean>;
  authTimer: ReturnType<typeof setInterval>;
  invoiceID: string;
}

export interface CryptoWallet {
  blob: string;
  keys: CryptoKeys;
}

export interface CryptoKeys {
  btc: string;
  ltc: string;
  evm: string;
  xmr: {
    address: string;
    spendKey: string;
    viewKey: string;
  };
}

export interface Location {
  localization: string;
  country: string;
  code: string;
  city: string;
  ip: string;
  map: string;
}

export interface ContactDetail {
  category: 'question' | 'feedback' | 'collaboration' | 'bug' | 'help' | 'other';
  message: string;
  subject: string;
  email: string;
  err: string;
}

export interface BodyField {
  email: string;
  access: string;
  username: string;
  password: string;
  subscription: string;
  intent: string;
  payment: string;
  secret: string;
  token: string;
  id: string;
  err: string;
}

export interface QueryUser {
  id: number;
  username: string;
  password: string;
  email: string;
  totp: string | null;
  recovery_hashes: string[];
  stripe_customer: string | null;
  sessions: string[];
  api_access: boolean | null;
  api_key: string | null;
}

export interface QueryIdentity {
  vault_revision: number;
  id: string;
  owner: number;
  creation_date: Date;
  payment_intent: string | null;
  subscription_id: string | null;
  plan: 'monthly' | 'annually' | 'lifetime' | null;
  status: 'active' | 'inactive' | 'frozen' | 'deleting' | null;
  proxy_server: string | null;
  crypto_invoice: string | null;
  proxy_password: string | null;
  location: string | null;
  picture: string | null;
  name: string | null;
  bio: string | null;
  age: number | null;
  sex: string | null;
  ethnicity: string | null;
  email: string | null;
  email_password: string | null;
  phone: string | null;
  wallet_blob: string | null;
  wallet_keys: CryptoKeys | null;
  wallet_funds: string | null;
  phone_sid: string | null;
}

export interface QueryInvoice {
  id: string;
  owner: number;
  plan: 'monthly' | 'annually' | 'lifetime';
  status: 'pending' | 'confirming' | 'paid' | 'underpaid' | 'expired' | 'refunded';
  xmr_subaddress: string;
  xmr_amount: string;
  renewal_id: string;
  creation_date: Date;
}

export type InitializedIdentity = QueryIdentity & {
  [
    Field in
      | 'proxy_server'
      | 'proxy_password'
      | 'location'
      | 'picture'
      | 'name'
      | 'bio'
      | 'age'
      | 'sex'
      | 'ethnicity'
      | 'email'
      | 'email_password'
      | 'phone'
      | 'wallet_blob'
      | 'wallet_keys'
  ]: NonNullable<QueryIdentity[Field]>;
};

export interface RegenerateIdentity {
  name: string;
  bio: string;
  age: number;
  sex: string;
  ethnicity: string;
}

export interface CreationProcess {
  kind: string;
  location: string;
  email: string;
  phone: string;
  crypto: string;
  regenerate: RegenerateIdentity;
  identity: RegenerateIdentity & {picture: string};
  repeat: {
    sex?: 'male' | 'female';
    name?: boolean;
    bio?: boolean;
  };
}

export interface CheckIdentity {
  error?: string;
  email?: string;
  phone?: string;
  name?: string;
  bio?: string;
  age?: number;
  sex?: string;
  ethnicity?: string;
  picture?: string;
  location?: string;
  wallet?: CryptoWallet;
}

export interface APIRequest {
  err: string;
  ethnicity: string;
  sex: string;
  age: number;
  name: string;
  bio: string;
  picture: string;
  id: number;
  identityID: string;
  username: string;
  password: string;
  website: string;
  totp: string | null;
  algorithm: string;
  uid: number;
  uuid: string;
  mailbox: string;
  since: number;
  from: number;
  draft: number;
  forward: string;
  accounts: {
    id: number;
    password: string;
    totp: string;
  }[];
  subject: string;
  body: string;
  to: string;
  inReplyTo: string;
  references: string[];
  attachments: Attachment[];
  sid: string;
  addressee: string;
  blob: string;
  keys: {
    address: string;
    viewKey: string;
    spendKey: string;
  };
  btc: string;
  ltc: string;
  evm: string;
  xmr: string;
  coin: CryptoCurrencies;
  addresses: string[];
  coinTo: CryptoCurrencies;
  coinFrom: CryptoCurrencies;
  destinationAddress: string;
  refundAddress: string;
  isFixed: boolean;
  provider: string;
  tradeID: string;
  amount: number;
  hex: string;
  plan: string;
  swapCoin: string;
}

export interface EmailContent {
  email: string;
  password: string;
  subject: string;
  to: string;
  body: string;
  attachments: Attachment[];
  inReplyTo: string;
  references: string[];
}

export interface Message {
  messageID: string;
  status: string;
  date: Date;
  error: string;
  body: string;
  from: string;
  to: string;
}

export interface CryptoWalletResponse {
  btc: {
    status: string;
    balance: number;
    utxos: UTXOData;
    history: TransactionsHistory;
    activeCount: number;
    nextIndex: number;
  };
  ltc: {
    status: string;
    balance: number;
    utxos: UTXOData;
    history: TransactionsHistory;
    activeCount: number;
    nextIndex: number;
  };
  eth: {
    status: string;
    balance: number;
    nonce: number;
    history: TransactionsHistory;
  };
  usdt: {
    status: string;
    balance: number;
    nonce: number;
    history: TransactionsHistory;
  };
  xmr: {
    status: string;
    startingDate: Date;
    nodeUrl: string;
  };
}

export type CryptoFees = {
  [key in CryptoCurrencies]: {
    low: number;
    medium: number;
    high: number;
  };
};

export type CryptoPrices = {
  [key in CryptoCurrencies]: {
    dailyChange: number;
    usdPrice: number;
    chart: number[];
  };
};

export type UTXOData = {
  txid: string;
  vout: number;
  address: string;
  pathIndex: number;
  value: number;
}[];

export type TransactionsHistory = {
  txid: string;
  type: 'sent' | 'received';
  counterparty: string;
  amount: number;
  date: Date;
}[];

export interface LoginChallenge {
  email: string;
  password: string;
  totp: string;
  expiresAt: number;
  attempts: number;
  busy: boolean;
}

export type EmailCodePurpose = 'confirm' | 'recover' | 'change';

export interface EmailCode {
  binding: string;
  hash: string;
  expiresAt: number;
  attempts: number;
}

export interface EmailDeliveryLimit {
  expiresAt: number;
  nextSend: number;
  count: number;
}

export interface SignupDraft {
  email: string;
  password: string;
  expiresAt: number;
  verified: boolean;
  username: string;
  secret: string;
  recoveryHashes: string[];
}

export interface CreationConnection {
  ready?: Promise<void>;
  jobID: string;
  busy: boolean;
  authTimer?: ReturnType<typeof setInterval>;
}

export interface IdentityProvision {
  location: string;
  picture: string;
  name: string;
  bio: string;
  age: number;
  sex: string;
  ethnicity: string;
  email: string;
  phone: string;
  wallet: CryptoWallet;
}

export interface VaultMutation {
  vaultRevision: number;
  blob: string;
  keys: CryptoKeys['xmr'];
  accounts: {id: number; password: string; totp: string | null}[];
  apply: (transaction: import('postgres').TransactionSql) => Promise<Record<string, unknown> | string>;
}
