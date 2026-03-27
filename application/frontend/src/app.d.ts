import type {Faq, Settings, Option, Identity, AnimationSelector, FullIdentity, Docs} from '$type';

declare global {
  namespace App {
    interface PageData {
      user: string;
      token: string;
      subsPlan?: string;
      isFrozen?: boolean;
      cryptoUse?: boolean;
      homepageIds?: string[];
      contactOptions?: Option[];
      animations?: AnimationSelector[];
      recoveryRemaining?: number;
      searchKeywords?: Option[];
      identities?: Identity[];
      identity?: FullIdentity;
      settings?: Settings;
      stripeKey?: string;
      cookie?: string;
      slug?: string;
      faqs?: Faq[];
      docs?: Docs;
    }
  }
}
