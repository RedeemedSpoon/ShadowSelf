export interface Notification {
  id: number | null;
  message: string | Error;
  type: 'success' | 'alert' | 'info';
}

export interface OTP {
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
