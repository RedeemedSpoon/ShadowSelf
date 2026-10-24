import type {HDKey} from '@scure/bip32';

export type Priority = 'low' | 'medium' | 'high';

export type PrivKeyType = 'mnemonic' | 'wif' | 'hex';

export type Coins = 'xmr' | 'eth' | 'btc' | 'ltc' | 'usdt';

export type BillingSteps = 'create' | 'confirm' | 'auth' | 'finish';

export type MoneroData = {viewKey: string; spendKey: string; address: string};

export type BtcSigner = {type: 'hd'; root: HDKey} | {type: 'key'; privKey: Uint8Array};

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
  senderAddress?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  feeAtoms?: string;
  privKeyType: PrivKeyType;
  wifKey: string;
  changePath?: {branch: 0 | 1; index: number};
  utxos?: UTXOData;
  nonce?: number;
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
  status: 'active' | 'inactive' | 'frozen';
  id: string;
  picture: string | null;
  name: string | null;
  country: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  accounts: number;
}

export interface FullIdentity {
  status: 'active' | 'frozen';
  vaultRevision: number;
  id: string;
  creationDate: string;
  plan: 'monthly' | 'annually' | 'lifetime' | null;
  paymentMethod: string;
  cryptoRefund: {usdAmount: string} | null;
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
  walletBlob: string;
}

export type IdentityMetadata =
  | FullIdentity
  | (Omit<
      FullIdentity,
      | 'status'
      | 'location'
      | 'picture'
      | 'name'
      | 'bio'
      | 'age'
      | 'sex'
      | 'ethnicity'
      | 'email'
      | 'phone'
      | 'walletKeys'
      | 'walletBlob'
    > & {
      status: 'inactive' | 'frozen';
      location: string | null;
      picture: string | null;
      name: string | null;
      bio: string | null;
      age: number | null;
      sex: string | null;
      ethnicity: string | null;
      email: string | null;
      phone: string | null;
      walletKeys: CryptoKeys | null;
      walletBlob: string | null;
    });

export interface Message {
  messageID: string;
  status: string;
  date: string;
  error: string;
  body: string;
  from: string;
  to: string;
}

export type Mailbox = 'INBOX' | 'Sent' | 'Drafts' | 'Junk';

export type EmailAttachment = Omit<Attachment, 'data'> & {index: number; data?: string};

export interface EmailSummary {
  mailbox: Mailbox;
  messageID: string | null;
  subject: string;
  from: string;
  to: string;
  date: string;
  uid: number;
  read: boolean;
}

export interface Email extends EmailSummary {
  references: string[];
  inReplyTo: string | null;
  attachments: EmailAttachment[];
  body: string;
  type: 'html' | 'text';
}

export interface Account {
  id: number;
  username: string;
  password: string;
  website: string | null;
  totp: string | null;
  algorithm: string | null;
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
  branch: 0 | 1;
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

export interface UnavailableWallet {
  status: 'Unavailable';
  balance: null;
  history: TransactionsHistory;
  error: string;
}

export interface UtxoWallet {
  status: 'Synced' | 'Incomplete';
  balance: number;
  utxos: UTXOData;
  history: TransactionsHistory;
  historyCursor: string | null;
  historyError?: string;
  activeCount: number;
  discovered: {receive: number; change: number};
  nextReceiveIndex: number | null;
  nextChangeIndex: number | null;
  scanned: number;
  scanLimit: number;
  error?: string;
}

export interface EvmWallet {
  status: 'Synced';
  balance: number;
  nonce: number;
  balanceAtoms: string;
  history: TransactionsHistory;
  historyCursor: string | null;
  historyError?: string;
}

export interface PendingEvmSend {
  nonce: number;
  hex: string;
  txid: string;
  coin: 'eth' | 'usdt';
}

export interface EvmPreparation {
  nonce: number;
  ethBalanceAtoms: string;
  usdtBalanceAtoms: string;
  amountAtoms: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface CryptoWallet {
  btc: UtxoWallet | UnavailableWallet;
  ltc: UtxoWallet | UnavailableWallet;
  eth: EvmWallet | UnavailableWallet;
  usdt: EvmWallet | UnavailableWallet;
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
  vaultRevision: number;
  walletBlob: string;
}

export interface InvoiceIdentity {
  name: string;
  email: string;
  invoice: string;
  date: string;
  dateDue: string;
}

export interface InvoiceClient {
  clientName: string;
  clientEmail: string;
}

export interface InvoiceTable {
  tableRows: {description: string; quantity: number; price: number; total: number}[];
  totalTransactionPrice: number;
}

export interface InvoicePayment {
  cryptoChoice: Coins;
  exchangeRate: number;
  cryptoDue: string;
  destAddr: string;
  qrImage: string;
}

export interface EmailPage {
  mailbox: Mailbox;
  messages: EmailSummary[];
  messagesCount: number;
  nextCursor: number | null;
  complete: boolean;
}

export interface EmailMutation {
  status?: 'sent' | 'uncertain';
  warning?: string;
}

export interface MessagePage {
  messages: Message[];
  nextCursor: string | null;
  complete: boolean;
}

export interface MessageDeletion {
  deleted: number;
  failed: number;
  complete: boolean;
}

export interface MoneroNodeAPI {
  nodeUrl: string;
  startingDate: string;
}

export interface WalletOverviewAPI {
  prices: Partial<CryptoPrices>;
  fees: Partial<CryptoFees>;
  wallet: Omit<CryptoWallet, 'xmr'>;
}

export interface WalletState extends WalletOverviewAPI {
  wallet: CryptoWallet;
}

export interface SwapQuotes {
  tradeID: string;
  bestProvider?: string;
  providers: Provider[];
}

export interface WalletTrade {
  tradeID: string;
  coinFrom: Coins;
  coinTo: Coins;
  depositAddress: string;
  depositAmount: number;
  depositMemo?: string;
  providerTradeID?: string;
  externalLink?: string;
}

export interface WalletSwapRecord {
  requestID: string;
  status: 'pending' | 'requested' | 'completed';
  createdAt: string;
  request: {
    coinFrom: Coins;
    coinTo: Coins;
    amount: number;
    tradeID: string;
    provider: string;
    destinationAddress: string;
    refundAddress: string;
    isFixed: boolean;
  };
  response: WalletTrade | null;
}

export interface CardCheckout {
  step: BillingSteps;
  clientSecret: string;
  identityID: string;
  cardName: string;
  last4: number;
}

export type InvoiceStatus =
  'pending' | 'confirming' | 'paid' | 'underpaid' | 'expired' | 'late' | 'refunded' | 'reconciling' | 'reconciliation';

export interface CryptoInvoice {
  invoiceID: string;
  usdAmount: string;
  identityID: string | null;
  depositAddress: string | null;
  depositAmount: string | null;
  depositMemo?: string;
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
    status: string;
    creationStatus: 'editing' | 'provisioning' | 'completed';
  } | null;
  loadError: string;
}

export type HomepageServiceId = 'identity' | 'vault' | 'email' | 'phone' | 'wallet' | 'card' | 'proxy' | 'cloud';

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
  icon: string;
  feature: HomepageServiceId;
  endpoints: ApiDocumentationEndpoint[];
}

export interface SignupState {
  stage: 'account' | 'email' | 'username' | 'security' | 'authenticator' | 'recovery' | 'complete';
  verified: boolean;
  email: string;
  username: string;
  secret: string;
  qr: string;
  recovery: string[];
}

export interface WalletAddressAllocation {
  coin: 'btc' | 'ltc';
  branch: 0 | 1;
  index: number;
  address: string;
}

export interface WalletHistoryPage {
  reset?: boolean;
  history: TransactionsHistory;
  historyCursor: string | null;
  historyError?: string;
}

export interface PendingUtxoSend {
  coin: 'btc' | 'ltc';
  txid: string;
  hex: string;
  inputs: {txid: string; vout: number}[];
  review: {amount: string; recipient: string; fee: string; unit: string};
}

export type GlobeVector = readonly [number, number, number];

export interface RoutingMarker {
  x: number;
  y: number;
  visibility: number;
}

export type ErrorScene = 'orbit' | 'jelly' | 'coffee' | 'break';
