import type {ElysiaWS} from 'elysia/ws';

export type User = {email: string; id: string; accountID: number; deletingAccount: boolean} | undefined;

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
  totp_counter: string | null;
  recovery_hashes: string[];
  stripe_customer: string | null;
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
  crypto_invoice: string | null;
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
  phone_sid: string | null;
}

export interface PaymentInvoiceRecovery {
  id: string;
  provider_reference: string;
  swap_coin: string;
  xmr_subaddress: string;
  xmr_amount: string;
  response: Record<string, unknown> | null;
}

export interface SwapReconciliationRequest {
  tradeID: string;
  coinFrom: string;
  coinTo: string;
  destinationAddress: string;
  refundAddress?: string;
  amount?: number;
  receiveAmount?: string;
}

export interface QueryInvoice {
  id: string;
  owner: number | null;
  plan: 'monthly' | 'annually' | 'lifetime';
  status: 'pending' | 'confirming' | 'paid' | 'underpaid' | 'expired' | 'refunded' | 'late' | 'reconciliation';
  xmr_subaddress: string;
  xmr_amount: string;
  renewal_id: string | null;
  creation_date: Date;
}

export type InitializedIdentity = QueryIdentity & {
  [
    Field in 'location' | 'picture' | 'name' | 'bio' | 'age' | 'sex' | 'ethnicity' | 'email' | 'email_password' | 'phone' | 'wallet_blob' | 'wallet_keys'
  ]: NonNullable<QueryIdentity[Field]>;
};

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

export type Mailbox = 'INBOX' | 'Sent' | 'Drafts' | 'Junk';

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

export interface WalletScanOptions {
  recovery?: boolean;
  signal?: AbortSignal;
}

export interface EvmProviderTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timeStamp: string;
  isError?: string;
  txreceipt_status?: string;
}

export interface UtxoProviderTransaction {
  txid: string;
  vin: {prevout?: {scriptpubkey_address: string; value: number}}[];
  vout: {scriptpubkey_address: string; value: number}[];
  status: {block_time?: number};
}

export interface UtxoWalletData {
  status: 'Synced' | 'Incomplete';
  balance: number;
  utxos: UTXOData;
  history: TransactionsHistory;
  activeCount: number;
  nextIndex: number | null;
  scanned: number;
  scanLimit: number;
  error?: string;
}

export interface WalletOverviewOperation {
  controller: AbortController;
  subscribers: number;
  result: Promise<PromiseSettledResult<CryptoWalletResponse['btc'] | CryptoWalletResponse['eth']>[]>;
}

export interface CryptoWalletResponse {
  btc: UtxoWalletData;
  ltc: UtxoWalletData;
  eth: {status: string; balance: number; balanceAtoms: string; nonce: number; history: TransactionsHistory};
  usdt: {status: string; balance: number; balanceAtoms: string; nonce: number; history: TransactionsHistory};
  xmr: {status: string; startingDate: Date; nodeUrl: string};
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
  enableTwoFactor: boolean;
  secret: string;
  recoveryHashes: string[];
  encryptedRecovery?: string;
  totpCounter?: number;
}

export interface SignupProgress {
  stage: 'email' | 'authenticator' | 'recovery';
  email: string;
  username: string;
  secret?: string;
  uri?: string;
  recovery?: string[];
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

export interface CreationDraft {
  location?: string;
  profile?: Omit<IdentityProvision, 'location' | 'email' | 'phone' | 'wallet'>;
  email?: string;
  phone?: string;
  wallet?: CryptoWallet;
}

export interface VaultMutation {
  vaultRevision: number;
  blob: string;
  keys: CryptoKeys['xmr'];
  accounts: {id: number; password: string; totp: string | null}[];
  apply: (transaction: import('postgres').TransactionSql) => Promise<Record<string, unknown>>;
}
