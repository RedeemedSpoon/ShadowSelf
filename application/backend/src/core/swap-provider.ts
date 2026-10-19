import {sql} from '@core/services';
import {trocadorApiKey} from '@core/config';
import {SWAP_API, SWAP_CHECKOUT_URL} from '@core/constants';
import {ApiError, requireProvider} from '@core/security';
import {net} from '@utils/utils';
import type {APIRequest, PaymentInvoiceRecovery, SwapReconciliationRequest} from '@type';

let paymentRecoveryCursor: string | null = null;
let walletRecoveryCursor: string | null = null;

export function createSwapProvider(fetcher: typeof fetch = fetch, apiKey = trocadorApiKey) {
  async function request(operation: string, parameters: URLSearchParams) {
    requireProvider(!!apiKey && !!SWAP_API && !!SWAP_CHECKOUT_URL, 'Crypto exchange');

    const response = await fetcher(`${SWAP_API}/${operation}?${parameters}`, {
      headers: {'API-Key': apiKey},
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new ApiError(503, 'swap_unavailable', 'The exchange provider is unavailable');
    }

    const data = await response.json();

    if (!data || typeof data !== 'object' || data.error) {
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
    async reconcile(input: SwapReconciliationRequest) {
      const response = await request('trade', new URLSearchParams({id: input.tradeID}));
      const data = Array.isArray(response) ? response.find((trade) => trade.trade_id === input.tradeID) : response;

      if (!data || data.status === 'new') {
        return null;
      }

      return parseTrade(data, input);
    },
    async paymentQuote(coin: string, amount: string) {
      const data = await request(
        'new_rate',
        new URLSearchParams({
          ticker_from: coin,
          ticker_to: 'xmr',
          network_from: net(coin),
          network_to: 'Mainnet',
          amount_to: amount,
          payment: 'True',
        }),
      );

      if (typeof data.trade_id !== 'string' || !data.trade_id) {
        throw new ApiError(502, 'invalid_swap_quote', 'The provider returned an invalid payment quote');
      }

      return data.trade_id;
    },
    async paymentTrade(input: {tradeID: string; coin: string; amount: string; address: string; refund: string}) {
      const data = await request(
        'new_trade',
        new URLSearchParams({
          id: input.tradeID,
          ticker_from: input.coin,
          ticker_to: 'xmr',
          network_from: net(input.coin),
          network_to: 'Mainnet',
          amount_to: input.amount,
          payment: 'True',
          address: input.address,
          address_memo: '0',
          refund: input.refund,
          refund_memo: '0',
        }),
      );

      return parseTrade(data, {
        tradeID: input.tradeID,
        coinFrom: input.coin,
        coinTo: 'xmr',
        destinationAddress: input.address,
        refundAddress: input.refund,
        receiveAmount: input.amount,
      });
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

      return parseTrade(data, input);
    },
  };
}

function sameAmount(value: unknown, expected: unknown) {
  const normalize = (input: unknown) => {
    if ((typeof input !== 'string' && typeof input !== 'number') || String(input).length > 100) {
      return undefined;
    }

    const match = String(input).match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
    const exponent = Number(match?.[3] || 0);

    if (!match || !Number.isInteger(exponent) || Math.abs(exponent) > 36) {
      return undefined;
    }

    let atoms = BigInt(match[1] + (match[2] || ''));
    let scale = (match[2]?.length || 0) - exponent;

    if (scale < 0) {
      atoms *= 10n ** BigInt(-scale);
      scale = 0;
    }

    while (scale > 0 && atoms % 10n === 0n) {
      atoms /= 10n;
      scale--;
    }

    return `${atoms}:${scale}`;
  };
  const actual = normalize(value);

  return actual !== undefined && actual === normalize(expected);
}

function parseTrade(data: Record<string, unknown>, input: SwapReconciliationRequest) {
  if (
    typeof data.trade_id !== 'string' ||
    !data.trade_id ||
    typeof data.address_provider !== 'string' ||
    !data.address_provider ||
    !Number.isFinite(Number(data.amount_from)) ||
    Number(data.amount_from) <= 0 ||
    typeof data.status !== 'string'
  ) {
    throw new ApiError(
      502,
      'uncertain_trade',
      'Trade outcome is uncertain. Check the provider before starting another trade',
    );
  }

  if (
    data.trade_id !== input.tradeID ||
    data.ticker_from !== input.coinFrom ||
    data.ticker_to !== input.coinTo ||
    data.network_from !== net(input.coinFrom) ||
    data.network_to !== net(input.coinTo) ||
    data.address_user !== input.destinationAddress ||
    (input.refundAddress !== undefined && (data.refund_address || '') !== input.refundAddress) ||
    (input.amount !== undefined && !sameAmount(data.amount_from, input.amount)) ||
    (input.receiveAmount !== undefined && !sameAmount(data.amount_to, input.receiveAmount))
  ) {
    throw new ApiError(
      502,
      'swap_reconciliation_mismatch',
      'The provider trade does not match this request. Manual review is required',
    );
  }

  return {
    status: data.status,
    depositAddress: data.address_provider,
    depositAmount: String(data.amount_from),
    depositMemo: data.address_provider_memo == null ? undefined : String(data.address_provider_memo),
    providerTradeID: typeof data.id_provider === 'string' ? data.id_provider : undefined,
    externalLink: `${SWAP_CHECKOUT_URL}/${encodeURIComponent(data.trade_id)}`,
  };
}

export const swapProvider = createSwapProvider();

export async function reconcilePaymentInvoice(
  invoice: PaymentInvoiceRecovery,
  provider = swapProvider,
  database = sql,
) {
  const trade = await provider.reconcile({
    tradeID: invoice.provider_reference,
    coinFrom: invoice.swap_coin,
    coinTo: 'xmr',
    destinationAddress: invoice.xmr_subaddress,
    receiveAmount: invoice.xmr_amount,
  });

  if (!trade) {
    return false;
  }

  const response = {...trade, invoiceID: invoice.id, coin: invoice.swap_coin};
  await database`UPDATE crypto_invoices SET provider_state = 'created', response = ${database.json(response)} WHERE id = ${invoice.id} AND provider_state = 'requested'`;
  invoice.response = response;

  return true;
}

export async function repairPaymentInvoices() {
  const invoices =
    await sql`SELECT id, provider_reference, swap_coin, xmr_subaddress, xmr_amount, response FROM crypto_invoices
    WHERE provider_state = 'requested' AND response IS NULL
    AND id > COALESCE(${paymentRecoveryCursor}::uuid, '00000000-0000-0000-0000-000000000000'::uuid) ORDER BY id LIMIT 100`;

  paymentRecoveryCursor = invoices.length === 100 ? invoices.at(-1)!.id : null;

  for (const invoice of invoices) {
    try {
      if (
        !invoice.provider_reference ||
        !(await reconcilePaymentInvoice(invoice as Parameters<typeof reconcilePaymentInvoice>[0]))
      ) {
        console.error(`Invoice ${invoice.id} remains uncertain; provider review is required`);
      }
    } catch {
      console.error(`Invoice ${invoice.id} reconciliation is unavailable; request was retained`);
    }
  }
}

export async function repairWalletSwapRequests() {
  const swaps = await sql`SELECT id, request FROM wallet_swaps WHERE status = 'requested'
    AND id > COALESCE(${walletRecoveryCursor}::uuid, '00000000-0000-0000-0000-000000000000'::uuid) ORDER BY id LIMIT 100`;

  walletRecoveryCursor = swaps.length === 100 ? swaps.at(-1)!.id : null;

  for (const swap of swaps) {
    try {
      const response = await swapProvider.reconcile(swap.request);

      if (response) {
        await sql`UPDATE wallet_swaps SET response = ${sql.json(response)}, status = 'completed' WHERE id = ${swap.id} AND status = 'requested'`;
      } else {
        console.error(`Swap ${swap.id} remains uncertain; provider review is required`);
      }
    } catch {
      console.error(`Swap ${swap.id} reconciliation is unavailable; request was retained`);
    }
  }
}
