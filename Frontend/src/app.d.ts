import type {Faq, Settings, Option, Identity, AnimationSelector} from '$type';

declare global {
  namespace App {
    interface PageData {
      user: string;
      homepageIds?: string[];
      contactOptions?: Option[];
      animations?: AnimationSelector[];
      searchKeywords?: Option[];
      identities?: Identity[];
      userSettings: Settings;
      faqs?: Faq[];
    }
  }
}
