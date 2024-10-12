export interface Notification {
  id: number | null;
  message: string | Error;
  type: 'success' | 'alert' | 'info';
}

export interface PricingModel {
  name: string;
  title: string;
  price: number;
  afterDiscount: number;
  description: string;
  days: number;
}

export const allPricingModel = {
  monthly: {
    title: 'Monthly Subscription',
    description: 'per month',
    days: 30,
    price: 5.99,
    afterDiscount: 4.99,
  },

  annually: {
    title: 'Annual Subscription',
    description: 'per year',
    days: 365,
    price: 59.99,
    afterDiscount: 49.99,
  },

  lifetime: {
    title: 'Lifetime Access',
    description: 'forever',
    days: Infinity,
    price: 249.99,
    afterDiscount: 199.99,
  },
};
