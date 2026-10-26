export {};

declare global {
  namespace App {
    interface PageState {
      purchaseFlow?: boolean;
    }

    interface Locals {
      user: string;
    }

    interface PageData {
      user: string;
    }
  }
}
