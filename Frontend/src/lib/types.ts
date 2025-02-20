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
  phone: number;
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
