export type User = {email: string; id: string} | undefined;
export type QueryResult = QueryResultUser & QueryResultIdentify;

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
  status: 'active' | 'inactive' | 'frozen';
}

export interface RegenerateIdentity {
  name: string;
  bio: string;
  age: number;
  sex: 'male' | 'female';
  ethnicity: string;
  err?: string;
}

export interface CreationProcess {
  kind: string;
  code: string;
  regenerate: RegenerateIdentity;
  identity: RegenerateIdentity & {picture: string};
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
