import {error} from '@sveltejs/kit';
import {PAYMENT_ASSET_OPTIONS, PRICING_TIERS} from '$constant';
import {PURCHASE_REVIEW_CASES} from '$lib/constants/purchase-review';
import type {Coins} from '$type';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = ({url}) => {
  const selected = url.searchParams.get('case') || 'card';
  const reviewCase = PURCHASE_REVIEW_CASES.find((item) => item.id === selected);
  const plan = url.searchParams.get('plan') || 'monthly';
  const coin = url.searchParams.get('coin') || 'xmr';

  if (
    !reviewCase ||
    !Object.hasOwn(PRICING_TIERS, plan) ||
    !PAYMENT_ASSET_OPTIONS.some((item) => item.value === coin)
  ) {
    error(400, 'Unknown purchase state, plan, or payment asset.');
  }

  return {reviewCase, plan: plan as keyof typeof PRICING_TIERS, coin: coin as Coins};
};
