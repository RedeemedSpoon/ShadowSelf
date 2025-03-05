import type {Faq, Settings, Option, Identity, AnimationSelector, FullIdentity} from '$type';

declare global {
  namespace App {
    interface PageData {
      user: string;
      homepageIds?: string[];
      contactOptions?: Option[];
      animations?: AnimationSelector[];
      recoveryRemaining?: number;
      searchKeywords?: Option[];
      identities?: Identity[];
      settings?: Settings;
      stripeKey?: string;
      cookie?: string;
      faqs?: Faq[];
      identity?: FullIdentity;
      token?: string;
      slug?: string;
    }
  }
}
