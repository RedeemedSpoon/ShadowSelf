export type User = {email: string; id: string} | undefined;

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
  secret: string;
  token: string;
  code: string;
  err: string;
}

export interface QueryResult {
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

export const pricingModal = {
  monthly: 'price_1QaM8sByRGrIIrNdSZuKcNV2',
  annually: 'price_1QaM8iByRGrIIrNdlLpIn0cI',
  lifetime: 'price_1QaM8JByRGrIIrNdDLtv6Gml',
};
