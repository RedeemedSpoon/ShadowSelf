import type {Component} from 'svelte';

export type Sections = 'info' | 'email' | 'phone' | 'card' | 'account';
export type Languages = 'curl' | 'python' | 'javascript' | 'go' | 'rust';
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type BillingSteps = 'create' | 'confirm' | 'auth' | 'finish';

export type FullEmail = Email & {messageID: string; date: Date};
export type Attachment = {filename: string; data: string};

export interface Notification {
  id: number | null;
  message: string;
  type: 'success' | 'alert' | 'info';
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Option {
  label: string;
  value: string;
}

export interface Settings {
  OTP: boolean;
  API: boolean;
  key: string;
  sessionUrl: string;
  recovery: number[];
  email: string;
}

export interface SettingsForm {
  toggleModel: boolean;
  message: string;
  secret: string;
  step: number;
  qr: string;
}

export interface Identity {
  id: string;
  picture: string;
  name: string;
  country: string;
  location: string;
  email: string;
  phone: string;
  card: number;
  accounts: number;
}

export interface Registration {
  step: string;
  email: string;
  username: string;
  recovery: string[];
  secret: string;
  qr: string;
}

export interface ServicesContent {
  title: string;
  description: string;
  style: string;
  images: string;
}

export interface AnimationNode {
  type: 'left' | 'right' | 'bottom';
  node: HTMLElement;
  delay: number;
}

export interface AnimationSelector {
  type: 'left' | 'right' | 'bottom';
  selector: string;
  delay?: number;
}

export interface EditorParams {
  subject: string;
  body: string;
  attachments: {
    filename: string;
    data: string;
  }[];
}

export interface FullIdentity {
  id: string;
  creation_date: Date;
  proxy_server: string;
  user_agent: string;
  location: string;
  picture: string;
  name: string;
  bio: string;
  age: number;
  sex: string;
  ethnicity: string;
  email: string;
  phone: string;
  card: number;
}

export interface CreationProcess {
  error: string;
  locations: {
    country: string;
    code: string;
    city: string;
    ip: string;
    map: string;
    localization: string;
  }[];
  identity: {
    picture: string;
    name: string;
    bio: string;
    age: number;
    sex: 'male' | 'female';
    ethnicity: string;
  };
  repeat: {name: string; bio: string};
  phone: {phone: string; formatted: string}[];
  email: string;
  card: string;
  sync: string;
  finish: boolean;
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

export interface APIResponse {
  err: string;
  accounts: Account[];
  emails: Inbox;
  messages: Message[];
  picture: string;
  ethnicity: string;
  name: string;
  age: number;
  sex: string;
  bio: string;
  id: string;
  username: string;
  password: string;
  website: string;
  totp: string;
  algorithm: string;
  nextEmails: Email[];
  fetchEmail: Email;
  sentEmail: FullEmail;
  savedDraft: FullEmail;
  forwardEmail: FullEmail;
  draft: number;
  uid: number;
  uuid: string;
  mailbox: string;
  from: number;
  since: number;
  subject: string;
  body: string;
  to: string;
  forward: string;
  inReplyTo: string;
  messageID: string;
  date: Date;
  attachments: Attachment[];
  addressee: string;
  messageSent: Message;
  conversation: Message[];
  sid: string;
}

export interface WebSocketMessage {
  type: 'email' | 'message';
  message: Message;
  email: Email;
}

export interface Docs {
  sections: {
    title: string;
    icon: Component;
    more: {
      title: string;
      method?: Method;
    }[];
  }[];
  content: {
    title: string;
    icon: Component;
    description: Component | string;
    routes?: Route[];
  }[];
}

export interface Route {
  title: string;
  description: Component;
  method: Method;
  url: string;
  response: APIResponse;
  code: {[key in Languages]: string};
}

export type Billing = {
  step: BillingSteps;
  clientSecret: string;
  identityID: string;
  cardName: string;
  last4: number;
};

export interface PricingModel {
  name: string;
  title: string;
  price: number;
  description: string;
}

export const allPricingModels = {
  monthly: {
    title: 'Monthly Subscription',
    description: 'per month',
    price: 4.99,
  },

  annually: {
    title: 'Annual Subscription',
    description: 'per year',
    price: 49.99,
  },

  lifetime: {
    title: 'Lifetime Access',
    description: 'one time purchase',
    price: 199.99,
  },
};
