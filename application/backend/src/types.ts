import {ImapSimple} from 'imap-simple';
import {ElysiaWS} from 'elysia/ws';

export type User = {email: string; id: string} | undefined;
export type QueryResult = QueryResultUser & QueryResultIdentify & QueryResultAccount;
export type Attachment = {filename: string; data: string};

export interface WSConnection {
  imapConnection: ImapSimple;
  websocket: ElysiaWS;
  phoneNumber: string;
  emailAddress: string;
}

export interface CryptoWallet {
  blob: string;
  keys: {
    btc: string;
    ltc: string;
    evm: string;
    xmr: {
      address: string;
      viewKey: string;
    };
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
  recovery: string[];
  subscription: string;
  intent: string;
  payment: string;
  secret: string;
  token: string;
  code: string;
  id: string;
  err: string;
}

export interface QueryResultUser {
  id: number;
  username: string;
  password: string;
  email: string;
  totp: string;
  recovery: string[];
  stripe_customer: string;
  revoke_session: string[];
  api_access: boolean;
  api_key: string;
}

export interface QueryResultIdentify {
  id: string;
  owner: number;
  creation_date: Date;
  payment_intent: string;
  subscription_id: string;
  plan: 'monthly' | 'annually' | 'lifetime';
  status: 'active' | 'inactive';
  proxy_server: string;
  proxy_password: string;
  location: string;
  picture: string;
  name: string;
  bio: string;
  age: number;
  sex: string;
  ethnicity: string;
  email: string;
  email_password: string;
  phone: string;
}

export interface QueryResultAccount {
  id: string;
  owner: string;
  username: string;
  password: string;
  website: string;
  algorithm: string;
  totp: string;
}

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
  username: string;
  password: string;
  website: string;
  totp: string;
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

export const emailTemplate = {
  confirm: {
    title: 'Confirm Your Email Address',
    description: 'Thank you for signing up for Shadowself. To create your account, you need to first verify your email address.',
    type: 'access',
    action: 'create your account & start using Shadowself',
  },
  change: {
    title: 'Change Your Email Address',
    description: 'To change the email address associated with your account, you need to first verify this new email address.',
    type: 'access',
    action: 'login to your account with the new email address',
  },
  recover: {
    title: 'Recover Your Account',
    description: 'Since you forgot your password, we will resort to using recovery token to get back your account.',
    type: 'recovery',
    action: 'login to your account & start using Shadowself',
  },
};

export const pricingModal = {
  monthly: process.env.MONTHLY_PRICE_ID,
  annually: process.env.ANNUAL_PRICE_ID,
  lifetime: process.env.LIFETIME_PRICE_ID,
};

export const pricingTable = {
  monthly: 500,
  annually: 5000,
  lifetime: 20000,
};
