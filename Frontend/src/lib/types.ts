export type Sections = 'info' | 'email' | 'phone' | 'card' | 'account';

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
  images: string[];
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
  repeat: {
    name: string;
    bio: string;
  };
  phone: {
    phone: string;
    formatted: string;
  }[];
  email: string;
  card: string;
  sync: string;
  finish: boolean;
}

export interface Inbox {
  messageID: string;
  subject: string;
  from: string;
  date: string;
  reference: string[] | null;
  inReplyTo: string | null;
  uid: number;
  attachments: {
    filename: string;
    data: string;
  }[];
  body: string;
  type: 'html' | 'text';
}

export interface FetchAPI {
  accounts: {
    id: number;
    username: string;
    password: string;
    website: string;
    totp: string;
    algorithm: string;
  }[];
  emails: {
    messagesCount: number;
    sentMessagesCount: number;
    draftsMessagesCount: number;
    junkMessagesCount: number;
    sent: Inbox[];
    inbox: Inbox[];
    junk: Inbox[];
    drafts: Inbox[];
  };
}

export interface IdentityComponentParams {
  ws: WebSocket;
  token: string;
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

export interface WebSocketResponse {
  error?: string;
  type?:
    | 'regenerate-picture'
    | 'regenerate-name'
    | 'regenerate-bio'
    | 'update-information'
    | 'add-account'
    | 'edit-account'
    | 'remove-account'
    | 'update-encryption'
    | 'new-email'
    | 'fetch-reply'
    | 'delete-email'
    | 'send-email'
    | 'send-draft'
    | 'load-more';
  picture?: string;
  ethnicity?: string;
  name?: string;
  age?: number;
  sex?: string;
  bio?: string;
  id: string;
  username?: string;
  password?: string;
  website: string;
  totp?: string;
  algorithm: string;
  accounts?: {
    id: number;
    password: string;
    totp?: string;
  }[];
  newEmail?: Inbox;
  fetchEmail?: Inbox;
  emails?: Inbox[];
  uid?: number;
  uuid?: string;
  mailbox?: string;
  from?: number;
  subject?: string;
  body?: string;
  to?: string;
  inReplyTo?: string;
  messageID?: string;
  date?: Date;
  attachments?: {
    filename: string;
    data: string;
  }[];
}

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
