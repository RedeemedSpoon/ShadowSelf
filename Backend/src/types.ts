export interface Message {
  message: string;
  type: 'success' | 'alert' | 'info';
}

export interface ContactDetail {
  category: 'question' | 'feedback' | 'collaboration' | 'refund' | 'bug' | 'help' | 'other';
  message: string;
  subject: string;
  email: string;
  err: string;
}

export interface BodyField {
  [key: string]: string;
  username: string;
  password: string;
  totpAuth: string;
  backups: string;
  err: string;
}
