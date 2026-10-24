import type {ElysiaWS} from 'elysia/ws';

export type User = {email: string; id: string; accountID: number} | undefined;

export type Attachment = {filename: string; data: string; cid?: string; contentType?: string};

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
  status: 'active' | 'inactive' | 'frozen' | null;
  crypto_invoice: string | null;
  location: string | null;
  picture: string | null;
  name: string | null;
  bio: string | null;
  age: number | null;
  sex: string | null;
  ethnicity: string | null;
  email: string | null;
  mailbox_password_encrypted: string | null;
  phone: string | null;
  wallet_blob: string | null;
  wallet_keys: CryptoKeys | null;
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
  identity_id: string | null;
  renewal: boolean;
  usd_amount: string;
  paid_at: Date | null;
  entitlement_start: Date | null;
  creation_date: Date;
}

export type InitializedIdentity = QueryIdentity & {
  [
    Field in
      | 'location'
      | 'picture'
      | 'name'
      | 'bio'
      | 'age'
      | 'sex'
      | 'ethnicity'
      | 'email'
      | 'mailbox_password_encrypted'
      | 'phone'
      | 'wallet_blob'
      | 'wallet_keys'
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
  type: 'html' | 'text';
  requestID: string;
  to: string;
  inReplyTo: string;
  references: string[];
  attachments: Attachment[];
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
  type: 'html' | 'text';
  messageID?: string;
  date?: Date;
  attachments: Attachment[];
  inReplyTo: string;
  references: string[];
}

export type MailSubmissionResult =
  {status: 'sent'; messageID: string; date: Date; type: 'html' | 'text'} | {status: 'uncertain'};

export interface MailSubmissionClaim {
  created: boolean;
  messageID: string;
  response?: MailSubmissionResult;
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

export interface WalletIssuedBounds {
  receive: number;
  change: number;
}

export interface WalletScanOptions {
  issued?: WalletIssuedBounds;
  recovery?: boolean;
  signal?: AbortSignal;
}

export interface EvmProviderTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timeStamp: string;
  blockNumber: string;
  contractAddress?: string;
  logIndex?: string;
  isError?: string;
  txreceipt_status?: string;
}

export interface UtxoProviderTransaction {
  txid: string;
  vin: {prevout?: {scriptpubkey_address: string; value: number}}[];
  vout: {scriptpubkey_address: string; value: number}[];
  status: {confirmed: boolean; block_time?: number};
}

export interface UtxoWalletData {
  status: 'Synced' | 'Incomplete';
  balance: number;
  utxos: UTXOData;
  history: TransactionsHistory;
  historyCursor: string | null;
  historyError?: string;
  activeCount: number;
  discovered: WalletIssuedBounds;
  nextReceiveIndex: number | null;
  nextChangeIndex: number | null;
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
  eth: {
    status: string;
    balance: number;
    balanceAtoms: string;
    nonce: number;
    history: TransactionsHistory;
    historyCursor: string | null;
    historyError?: string;
  };
  usdt: {
    status: string;
    balance: number;
    balanceAtoms: string;
    nonce: number;
    history: TransactionsHistory;
    historyCursor: string | null;
    historyError?: string;
  };
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
  branch: 0 | 1;
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
  stage: SignupProgress['stage'];
  email: string;
  password: string;
  expiresAt: number;
  verified: boolean;
  username: string;
  enableTwoFactor: boolean | null;
  secret: string;
  recoveryHashes: string[];
  encryptedRecovery?: string;
  totpCounter?: number;
}

export interface SignupProgress {
  stage: 'account' | 'email' | 'username' | 'security' | 'authenticator' | 'recovery' | 'complete';
  verified: boolean;
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
  walletBlob: string;
  blob: string;
  keys: CryptoKeys['xmr'];
  accounts: {id: number; password: string; totp: string | null}[];
  apply: (transaction: import('postgres').TransactionSql) => Promise<Record<string, unknown>>;
}

export interface PhoneMessage {
  messageID: string;
  status: string;
  date: Date;
  error: string;
  body: string;
  from: string;
  to: string;
}

export interface PhonePage {
  messages: PhoneMessage[];
  complete: boolean;
  nextCursor: string | null;
}

export interface PhoneProvider {
  conversations(phone: string, cursor?: string): Promise<PhonePage>;
  conversation(phone: string, contact: string, cursor?: string): Promise<PhonePage>;
  send(phone: string, to: string, body: string): Promise<PhoneMessage>;
  removeConversation(phone: string, contact: string): Promise<{deleted: number; failed: number; complete: boolean}>;
  available(location: string): Promise<string[]>;
}

export interface EvmTransferRequest {
  coin: 'eth' | 'usdt';
  recipient: string;
  amount: string;
  priority: 'low' | 'medium' | 'high';
  sweep?: boolean;
}

export interface StripeCleanup {
  id: string;
  customer_id: string;
  checkout_reference: string | null;
  subscription_id: string | null;
  payment_intent: string | null;
  refund_requested: boolean;
  requested_at: Date;
  resume_invoices: string[];
  retry_at: Date | null;
  attempts: number;
  error_code: string | null;
}

export interface StripeEventReference {
  id: string;
  type: string;
  object_id: string;
}

export interface CryptoRefund {
  id: string;
  invoice_id: string;
  owner: number | null;
  destination_encrypted: string;
  usd_amount: string;
  xmr_amount: string | null;
  metadata_encrypted: string | null;
  tx_hash: string | null;
  requested_at: Date;
  attempts: number;
  error_code: string | null;
}

export interface WalletAddressAllocation {
  coin: 'btc' | 'ltc';
  branch: 0 | 1;
  index: number;
  address: string;
}

export type ChainNetwork = 'btc' | 'ltc' | 'eth' | 'ethRpc' | 'xmr';

export interface WalletHistoryPage {
  reset?: boolean;
  history: TransactionsHistory;
  historyCursor: string | null;
  historyError?: string;
}

export interface UtxoHistoryCursor {
  kind: 'utxo';
  coin: 'btc' | 'ltc';
  key: string;
  endpoint: string;
  counts: [number, number];
  after: {branch: 0 | 1; index: number; txid: string | null; remaining: number}[];
  mempoolLimited?: boolean;
}

export interface EvmHistoryGroup {
  hash: string;
  net: string;
  timestamp: string;
  counterparties: string[];
}

export interface EvmHistoryCursor {
  kind: 'evm';
  coin: 'eth' | 'usdt';
  key: string;
  endpoint: string;
  endblock: number;
  page: number;
  previous: string;
  carry?: EvmHistoryGroup;
}
