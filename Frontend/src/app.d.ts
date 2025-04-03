import type {Faq, Settings, Option, Identity, AnimationSelector, FullIdentity, Docs} from '$type';

declare global {
  namespace App {
    interface PageData {
      user: string;
      token: string;
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
      slug?: string;
      docs?: Docs;
    }
  }
}
