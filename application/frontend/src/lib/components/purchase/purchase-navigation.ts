import {onMount} from 'svelte';
import {afterNavigate, goto, pushState} from '$app/navigation';
import {page} from '$app/state';
import type {PurchaseDraft} from '$type';
import {PAYMENT_ASSET_OPTIONS, PRICING_TIERS} from '$constant';

export function createPurchaseNavigation(path: string, onclose: () => void) {
  let active = false;
  let resolveReady: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  afterNavigate(() => resolveReady());

  function close() {
    active = false;
    onclose();
  }

  onMount(() => {
    const onBack = () => {
      if (active) {
        close();
      }
    };

    window.addEventListener('popstate', onBack);

    return () => window.removeEventListener('popstate', onBack);
  });

  return {
    async start() {
      if (active) {
        return;
      }

      active = true;
      await ready;

      if (active) {
        pushState(page.url, {...page.state, purchaseFlow: true});
      }
    },
    dismiss() {
      if (active && page.state.purchaseFlow) {
        window.history.back();
      } else {
        close();
      }
    },
    async prepareHandoff() {
      active = false;
      await ready;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await goto(path, {replaceState: true, invalidateAll: true});
    },
  };
}

export function readPurchaseDraft(key: string): PurchaseDraft | null {
  try {
    const saved = sessionStorage.getItem(key);

    if (!saved) {
      return null;
    }

    const draft: PurchaseDraft = JSON.parse(saved);

    if (
      !Object.hasOwn(PRICING_TIERS, draft.plan) ||
      !['card', 'crypto'].includes(draft.method) ||
      !PAYMENT_ASSET_OPTIONS.some((asset) => asset.value === draft.ticker) ||
      typeof draft.refund !== 'string'
    ) {
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

export function savePurchaseDraft(key: string, draft: PurchaseDraft | null) {
  try {
    if (draft) {
      sessionStorage.setItem(key, JSON.stringify(draft));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    return;
  }
}
