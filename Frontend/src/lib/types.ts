export interface Notification {
  id: number | null;
  message: string | Error;
  type: 'success' | 'alert' | 'info';
}

export interface PricingModel {
  name: string;
  price: number;
  afterDiscount: number;
  description: string;
  days: number;
}

export const allPricingModel = {
  monthly: {price: 5.99, afterDiscount: 4.99, days: 30, description: 'per month'},
  annually: {price: 59.99, afterDiscount: 49.99, days: 365, description: 'per year'},
  lifetime: {price: 249.99, afterDiscount: 199.99, days: Infinity, description: 'forever'},
};
