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
  recovery: number[];
}

export interface Identity {
  id: string;
  avatar: string;
  name: string;
  country: string;
  location: string;
  email: string;
  phone: number;
  card: number;
  accounts: number;
}

export interface Registration {
  step: string;
  username: string;
  recovery: string[];
  secret: string;
  qr: string;
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

export interface ServicesContent {
  title: string;
  description: string;
  images: string[];
}

export interface PricingModel {
  name: string;
  title: string;
  price: number;
  days: number;
  description: string;
}

export const allPricingModel = {
  monthly: {
    title: 'Monthly Subscription',
    description: 'per month',
    days: 30,
    price: 4.99,
  },

  annually: {
    title: 'Annual Subscription',
    description: 'per year',
    days: 365,
    price: 49.99,
  },

  lifetime: {
    title: 'Lifetime Access',
    description: 'one time purchase',
    days: Infinity,
    price: 199.99,
  },
};
