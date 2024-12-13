export type User = {username: string; password: string; id: string} | undefined;

export interface ContactDetail {
  category: 'question' | 'feedback' | 'collaboration' | 'bug' | 'help' | 'other';
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
  revoke_session: string[];
  api_access: boolean;
  api_key: string;
}
