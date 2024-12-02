export type User = {username: string; password: string} | undefined;

export interface ContactDetail {
  category: 'question' | 'feedback' | 'collaboration' | 'refund' | 'bug' | 'help' | 'other';
  message: string;
  subject: string;
  email: string;
  err: string;
}

export interface BodyField {
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
  totp: string;
  recovery: string[];
  credit_card: string;
  crypto_wallet: string;
  api_key: string;
}
