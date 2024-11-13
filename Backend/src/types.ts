export interface Message {
  message: string;
  type: 'success' | 'alert';
}

export interface ContactDetail {
  category: 'question' | 'feedback' | 'collaboration' | 'refund' | 'bug' | 'help' | 'other';
  message: string;
  subject: string;
  email: string;
}

export interface BodyAccount {
  username: string;
  password: string;
}
