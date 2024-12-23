import type {Faq, Settings, Option, Identity, AnimationSelector} from '$type';
import {type Stripe} from '@stripe/stripe-js';

declare global {
  namespace App {
    interface PageData {
      user: string;
      homepageIds?: string[];
      contactOptions?: Option[];
      animations?: AnimationSelector[];
      searchKeywords?: Option[];
      identities?: Identity[];
      settings?: Settings;
      stripe?: Stripe;
      faqs?: Faq[];
    }
  }
}
