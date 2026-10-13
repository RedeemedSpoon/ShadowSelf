import type {HDKey} from '@scure/bip32';

export type Priority = 'low' | 'medium' | 'high';

export type PrivKeyType = 'mnemonic' | 'wif' | 'hex';

export type Coins = 'xmr' | 'eth' | 'btc' | 'ltc' | 'usdt';

export type BillingSteps = 'create' | 'confirm' | 'auth' | 'finish';

export type MoneroData = {viewKey: string; spendKey: string; address: string};

export type BtcSigner = {type: 'hd'; root: HDKey} | {type: 'key'; privKey: Uint8Array};

export type FullEmail = Email & {messageID: string; date: Date};

export type Attachment = {filename: string; data: string; cid?: string; contentType?: string};

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

export interface transactionData {
  estimatedFee: number | {fee: number; feeAtoms?: string};
  privKeyType: PrivKeyType;
  wifKey: string;
  index?: number;
  xpubKey?: string;
  utxos?: UTXOData;
  nonce?: number;
  balance?: number;
  gasBalance?: number;
  balanceAtoms?: string;
  gasBalanceAtoms?: string;
}

export interface Provider {
  name: string;
  logo: string;
  eta: number;
  kycRating: 'A' | 'B' | 'C' | 'D';
  logPolicy: 'A' | 'B' | 'C' | 'D';
  costPercentage: number;
  returnUsd: number;
  returnCoin: number;
  isFixed: boolean;
}

export interface Identity {
  status: 'active' | 'inactive' | 'frozen' | 'deleting';
  id: string;
  picture: string;
  name: string;
  country: string;
  location: string;
  email: string;
  phone: string;
  accounts: number;
  walletFunds: string | null;
}

export interface FullIdentity {
  status: 'active' | 'inactive' | 'frozen' | 'deleting';
  vaultRevision: number;
  id: string;
  creationDate: string;
  plan: 'monthly' | 'annually' | 'lifetime' | null;
  paymentMethod: string;
  location: string;
  picture: string;
  name: string;
  bio: string;
  age: number;
  sex: string;
  ethnicity: string;
  email: string;
  phone: string;
  walletKeys: CryptoKeys;
  walletFunds: string | null;
  walletBlob: string;
}

export interface Message {
  messageID: string;
  status: string;
  date: string;
  error: string;
  body: string;
  from: string;
  to: string;
}

export interface Email {
  messageID: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  references: string[] | null;
  inReplyTo: string | null;
  uid: number;
  attachments: Attachment[];
  body: string;
  type: 'html' | 'text';
}

export interface Account {
  id: number;
  username: string;
  password: string;
  website: string;
  totp: string;
  algorithm: string;
}

export interface Inbox {
  messagesCount: number;
  sentMessagesCount: number;
  draftsMessagesCount: number;
  junkMessagesCount: number;
  sent: Email[];
  inbox: Email[];
  junk: Email[];
  drafts: Email[];
}

export type CryptoFees = {
  [key in Coins]: {
    low: number;
    medium: number;
    high: number;
  };
};

export type CryptoPrices = {
  [key in Coins]: {
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
  rawTx?: string;
  value: number;
}[];

export type TransactionsHistory = {
  txid: string;
  type: 'sent' | 'received';
  counterparty: string;
  amount: number;
  date: Date;
}[];

export interface CryptoWallet {
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
    balanceAtoms: string;
    history: TransactionsHistory;
  };
  usdt: {
    status: string;
    balance: number;
    nonce: number;
    balanceAtoms: string;
    history: TransactionsHistory;
  };
  xmr: {
    status: string;
    startingDate: Date;
    nodeUrl: string;
    history: TransactionsHistory;
    unlockedBalance: number;
    balance: number;
  };
}

export type ApiResult<T> = {ok: true; data: T} | {ok: false; error: string; code: string; status: number | null};

export interface InformationAPI {
  picture?: string;
  ethnicity?: string;
  name?: string;
  age?: number;
  sex?: string;
  bio?: string;
}

export interface AccountAPI {
  accounts: Account[];
  id?: string;
  username?: string;
  password?: string;
  website?: string;
  totp?: string;
  algorithm?: string;
}

export interface EmailAPI {
  warning?: string;
  emails: Inbox;
  nextEmails?: Email[];
  fetchEmail?: Email;
  sentEmail?: FullEmail;
  savedDraft?: FullEmail;
  forwardEmail?: FullEmail;
  draft?: number;
  uid?: number;
  uuid?: string;
  mailbox?: string;
  from?: number;
  since?: number;
  subject?: string;
  body?: string;
  to?: string;
  forward?: string;
  inReplyTo?: string;
  messageID?: string;
  date?: Date;
  attachments?: Attachment[];
}

export interface PhoneAPI {
  messages: Message[];
  addressee?: string;
  messageSent?: Message;
  conversation?: Message[];
  sid?: string;
}

export interface MoneroNodeAPI {
  nodeUrl: string;
  startingDate: string;
}

export interface CryptoAPI {
  prices: CryptoPrices;
  fees: CryptoFees;
  wallet: CryptoWallet;
  txid?: string;
  utxos?: UTXOData;
  balance?: number;
  nonce?: number;
  tradeID?: string;
  bestProvider?: string;
  providers?: Provider[];
  coinFrom?: Coins;
  amount?: number;
  coinTo?: Coins;
  status?: string;
  depositAddress?: string;
  depositAmount?: number;
  depositMemo?: string;
  providerTradeID?: string;
  externalLink?: string;
  blob?: string;
}

export interface CardCheckout {
  step: BillingSteps;
  clientSecret: string;
  identityID: string;
  cardName: string;
  last4: number;
}

export type InvoiceStatus = 'pending' | 'confirming' | 'paid' | 'underpaid' | 'expired' | 'late' | 'refunded';

export interface CryptoInvoice {
  invoiceID: string;
  identityID: string;
  depositAddress: string;
  depositAmount: string;
  coin: string;
  externalLink?: string;
  status: InvoiceStatus;
  remainingAmount: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreationData {
  id: string;
  creation: {
    draft: Record<string, unknown>;
    locations: {code: string; country: string; city: string; localization: string}[];
    status: string;
    creationStatus: 'editing' | 'provisioning' | 'completed';
  } | null;
  loadError: string;
}

export type HomepageServiceId = 'identity' | 'vault' | 'email' | 'phone' | 'wallet';

export interface ApiDocumentationEndpoint {
  method: string;
  path: string;
  detail: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  query?: string;
}

export interface ApiDocumentationGroup {
  id: string;
  title: string;
  endpoints: ApiDocumentationEndpoint[];
}
