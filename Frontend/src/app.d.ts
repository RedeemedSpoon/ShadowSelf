import type {Faq, Option, Identity, AnimationSelector} from '$type';

declare global {
  namespace App {
    interface PageData {
      user: string;
      contactOptions?: Option[];
      homepageIds?: string[];
      animations?: AnimationSelector[];
      searchKeywords?: Option[];
      identities?: Identity[];
      faqs?: Faq[];
    }
  }
}
