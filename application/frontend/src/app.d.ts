export {};

declare global {
  namespace App {
    interface Locals {
      user: string;
    }

    interface PageData {
      user: string;
    }
  }
}
