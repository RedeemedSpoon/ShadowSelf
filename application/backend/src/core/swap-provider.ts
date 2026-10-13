import {trocadorApiKey} from '@core/config';
import {ApiError, requireProvider} from '@core/security';
import {net} from '@utils/utils';
import type {APIRequest} from '@type';

function createSwapProvider(fetcher: typeof fetch = fetch, apiKey = trocadorApiKey) {
  async function request(operation: string, parameters: URLSearchParams) {
    requireProvider(!!apiKey, 'Crypto exchange');

    const response = await fetcher(`https://api.trocador.app/${operation}?${parameters}`, {
      headers: {'API-Key': apiKey},
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new ApiError(503, 'swap_unavailable', 'The exchange provider is unavailable');
    }

    const data = await response.json();

    if (data.error) {
      throw new ApiError(502, 'swap_failed', 'The exchange provider could not complete this request');
    }

    return data;
  }

  return {
    async quote(input: Pick<APIRequest, 'coinFrom' | 'coinTo' | 'amount'>) {
      const {coinFrom, coinTo, amount} = input;
      const data = await request(
        'new_rate',
        new URLSearchParams({
          ticker_from: coinFrom,
          ticker_to: coinTo,
          network_from: net(coinFrom),
          network_to: net(coinTo),
          amount_from: String(amount),
        }),
      );

      if (!data.trade_id || !Array.isArray(data.quotes?.quotes)) {
        throw new ApiError(502, 'invalid_swap_quote', 'The provider returned an invalid quote');
      }

      return {
        tradeID: data.trade_id,
        bestProvider: data.provider,
        coinFrom,
        coinTo,
        amount,
        providers: data.quotes.quotes.map((value: Record<string, string>) => ({
          isFixed: value.fixed === 'True',
          costPercentage: Number(value.USD_total_cost_percentage),
          returnUsd: value.amount_to_USD,
          returnCoin: value.amount_to,
          kycRating: value.kycrating,
          logPolicy: value.logpolicy,
          logo: value.provider_logo,
          name: value.provider,
          eta: value.eta,
        })),
      };
    },
    async trade(input: APIRequest) {
      const data = await request(
        'new_trade',
        new URLSearchParams({
          id: input.tradeID,
          ticker_from: input.coinFrom,
          ticker_to: input.coinTo,
          network_from: net(input.coinFrom),
          network_to: net(input.coinTo),
          amount_from: String(input.amount),
          address: input.destinationAddress,
          address_memo: '0',
          refund: input.refundAddress,
          refund_memo: '0',
          provider: input.provider,
          fixed: input.isFixed ? 'True' : 'False',
        }),
      );

      if (!data.trade_id || !data.address_provider || !Number.isFinite(Number(data.amount_from)) || Number(data.amount_from) <= 0) {
        throw new ApiError(502, 'uncertain_trade', 'Trade outcome is uncertain. Check the provider before starting another trade');
      }

      return {
        status: data.status,
        depositAddress: data.address_provider,
        depositAmount: String(data.amount_from),
        depositMemo: data.address_provider_memo,
        providerTradeID: data.id_provider,
        externalLink: `https://trocador.app/en/checkout/${data.trade_id}`,
      };
    },
  };
}

export const swapProvider = createSwapProvider();
