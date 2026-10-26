import {SWAP_CHECKOUT_URL} from '@core/constants';
import {allocateInvoiceAddress, quoteXmr, parseXmr, purchaseUsdAmount} from '@core/wallet/wallet-service';
import {POLL_PRICES_INTERVAL} from '@core/constants';
import {
  cryptoPrices,
  invoiceConnections,
  billingWallet,
  billingReadiness,
  guardedAuthTimer,
  socketCapacityAvailable,
} from '@core/states';
import {CRYPTO_DISCOUNT, PRICING_TIERS, PAYMENT_WINDOW_MIN, UUID_PATTERN} from '@core/constants';
import middlewareBase from '@middlewares/middleware-base';
import {trocadorApiKey, billingEnabled} from '@core/config';
import {ApiError, requireProvider} from '@core/security';
import {error} from '@utils/utils';
import {swapProvider, reconcilePaymentInvoice} from '@core/providers/swap-provider';
import {checkAPI} from '@utils/checks';
import {sql} from '@core/services';
import {withAccountLock} from '@core/identity/identity-service';
import type {PaymentInvoiceRecovery} from '@type';
import {Elysia, t} from 'elysia';

export default new Elysia({prefix: '/api/billing/crypto', websocket: {idleTimeout: 300}})
  .use(middlewareBase)
  .guard({authenticated: true})
  .post('/invoices', ({set, user, body}) => createInvoice(set, user.email, body, false))
  .post('/renewals', ({set, user, body}) => createInvoice(set, user.email, body, true))
  .get('/requests/:id', async ({set, user, params}) => {
    if (!UUID_PATTERN.test(params.id)) {
      return error(set, 404, 'Payment request not found');
    }

    const invoices =
      await sql`SELECT id FROM crypto_invoices WHERE owner = ${user.accountID} AND request_id = ${params.id}`;

    if (!invoices.length) {
      return error(set, 404, 'Payment request not found');
    }

    return {invoiceID: invoices[0].id};
  })
  .get('/invoices/:id', async ({set, user, params}) => {
    if (!UUID_PATTERN.test(params.id)) {
      return error(set, 404, 'Invoice not found');
    }

    const invoices = await sql`SELECT c.*,
      (SELECT total FROM invoice_observations WHERE invoice_id = c.id ORDER BY id DESC LIMIT 1) AS observed_total
      FROM crypto_invoices c
      WHERE c.id = ${params.id} AND c.owner = ${user.accountID}`;

    const invoice = invoices[0];

    if (!invoice) {
      return error(set, 404, 'Invoice not found');
    }

    if (invoice.provider_state === 'requested' && invoice.provider_reference && !invoice.response) {
      await reconcilePaymentInvoice(invoice as PaymentInvoiceRecovery).catch(() => {});
    }

    const expiresAt = new Date(invoice.creation_date).getTime() + PAYMENT_WINDOW_MIN * 60_000;
    const remaining = parseXmr(invoice.xmr_amount) - BigInt(invoice.observed_total || '0');
    const atoms = remaining > 0n ? remaining : 0n;

    return {
      invoiceID: invoice.id,
      coin: invoice.swap_coin,
      usdAmount: invoice.usd_amount,
      depositAddress: null,
      depositAmount: null,
      ...(invoice.provider_reference
        ? {externalLink: `${SWAP_CHECKOUT_URL}/${encodeURIComponent(invoice.provider_reference)}`}
        : {}),
      ...invoice.response,
      status:
        !invoice.response && invoice.provider_state === 'requested'
          ? 'reconciling'
          : invoice.status === 'pending' && Date.now() >= expiresAt
            ? 'expired'
            : invoice.status,
      identityID: invoice.identity_id || null,
      createdAt: invoice.creation_date,
      expiresAt: new Date(expiresAt).toISOString(),
      remainingAmount: `${atoms / 1_000_000_000_000n}.${(atoms % 1_000_000_000_000n).toString().padStart(12, '0')}`,
    };
  })
  .ws('/invoices/:id/events', {
    params: t.Object({id: t.String()}),
    async open(ws) {
      const invoiceID = ws.data.params.id;
      const authorize = ws.data.authorize;
      const user = ws.data.user;

      if (!UUID_PATTERN.test(invoiceID)) {
        return ws.close(1008, 'Invalid invoice reference');
      }

      try {
        if (!user || !(await authorize())) {
          return ws.close(1008, 'Session expired');
        }
      } catch {
        return ws.close(1011, 'Authorization unavailable');
      }

      const invoice =
        await sql`SELECT c.status, i.id AS identity_id FROM crypto_invoices c JOIN users u ON u.id = c.owner
        LEFT JOIN identities i ON i.crypto_invoice = c.id AND i.owner = c.owner
        WHERE c.id = ${invoiceID} AND u.email = ${user.email}`.catch(() => null);

      if (invoice === null) {
        return ws.close(1011, 'Invoice authorization unavailable');
      }

      if (!invoice.length) {
        ws.send(JSON.stringify({error: 'Invoice not found'}));

        return ws.close();
      }

      ws.send(JSON.stringify({status: invoice[0].status, identityID: invoice[0].identity_id}));

      if (ws.raw.readyState !== 1) {
        return;
      }

      if (!socketCapacityAvailable(user.accountID)) {
        return ws.close(1013, 'Connection limit reached');
      }

      const authTimer = guardedAuthTimer(authorize, (code, reason) => ws.close(code, reason));
      invoiceConnections.set(ws.id, {websocket: ws, invoiceID, authorize, authTimer});
    },

    async close(ws) {
      clearInterval(invoiceConnections.get(ws.id)?.authTimer);
      invoiceConnections.delete(ws.id);
    },

    async message(ws, message) {
      try {
        if (!(await ws.data.authorize())) {
          return ws.close(1008, 'Session expired');
        }
      } catch {
        return ws.close(1011, 'Authorization unavailable');
      }

      if (message === 'ping') {
        ws.send('pong');
      }
    },
  });

async function createInvoice(set: Record<string, any>, email: string, body: unknown, renewal: boolean) {
  if (!billingEnabled) {
    throw new ApiError(503, 'billing_disabled', 'Purchases and renewals are currently disabled');
  }

  const fields = ['plan', 'swapCoin', '?refundAddress', ...(renewal ? ['identityID'] : [])];
  const {err, plan, swapCoin, refundAddress, identityID} = await checkAPI(body, fields);

  if (err) {
    return error(set, 400, err);
  }

  const requestID = (body as {requestID?: string})?.requestID;

  if (!UUID_PATTERN.test(requestID || '')) {
    return error(set, 400, 'A payment request ID is required');
  }

  if (
    !billingWallet ||
    !cryptoPrices.xmr?.usdPrice ||
    Date.now() - billingReadiness.priceSync > POLL_PRICES_INTERVAL * 3
  ) {
    return error(set, 503, 'Crypto billing is initializing');
  }

  const users = await sql`SELECT id FROM users WHERE email = ${email}`;

  if (!users.length) {
    return error(set, 401, 'Sign in to continue');
  }

  const owner = users[0].id;

  if (renewal) {
    const identities =
      await sql`SELECT id FROM identities WHERE id = ${identityID} AND owner = ${owner} AND plan = ${plan}`;

    if (!identities.length) {
      return error(set, 404, 'Identity not found or plan does not match');
    }
  }

  const xmrAmount = quoteXmr(
    PRICING_TIERS[plan as keyof typeof PRICING_TIERS],
    CRYPTO_DISCOUNT,
    cryptoPrices.xmr.usdPrice,
  );

  return withAccountLock(owner, async (connection) => {
    const owners = await connection`SELECT id FROM users WHERE id = ${owner}`;

    if (!owners.length) {
      return error(set, 401, 'Sign in to continue');
    }

    const unresolved =
      await connection`SELECT id FROM crypto_invoices WHERE owner = ${owner} AND provider_state = 'requested' AND response IS NULL AND request_id <> ${requestID!} LIMIT 1`;

    if (unresolved.length) {
      set.status = 202;

      return {invoiceID: unresolved[0].id, status: 'reconciling'};
    }

    const usdAmount = purchaseUsdAmount(PRICING_TIERS[plan as keyof typeof PRICING_TIERS], CRYPTO_DISCOUNT);

    await connection`INSERT INTO crypto_invoices (owner, plan, xmr_amount, identity_id, renewal, usd_amount, request_id, swap_coin, refund_address)
    VALUES (${owner}, ${plan}, ${xmrAmount}, ${renewal ? identityID : null}, ${renewal}, ${usdAmount}, ${requestID!}, ${swapCoin}, ${refundAddress || null})
    ON CONFLICT (owner, request_id) DO NOTHING`;

    const invoices =
      await connection`SELECT * FROM crypto_invoices WHERE owner = ${owner} AND request_id = ${requestID!}`;

    const invoice = invoices[0];

    if (
      invoice.renewal !== renewal ||
      invoice.plan !== plan ||
      invoice.swap_coin !== swapCoin ||
      (invoice.refund_address || '') !== (refundAddress || '') ||
      (renewal && invoice.identity_id !== identityID)
    ) {
      return error(set, 409, 'This payment request has different details. Start a new purchase');
    }

    if (invoice.response) {
      return invoice.response;
    }

    if (invoice.provider_state === 'requested') {
      await reconcilePaymentInvoice(invoice as PaymentInvoiceRecovery).catch(() => {});

      if (invoice.response) {
        return invoice.response;
      }

      set.status = 202;

      return {invoiceID: invoice.id, status: 'reconciling'};
    }

    if (Date.now() >= new Date(invoice.creation_date).getTime() + PAYMENT_WINDOW_MIN * 60_000) {
      return error(set, 410, 'Quote expired. Start a new purchase');
    }

    if (!invoice.xmr_subaddress) {
      const address = await allocateInvoiceAddress(invoice.id, connection);
      await connection`UPDATE crypto_invoices SET xmr_subaddress = ${address} WHERE id = ${invoice.id}`;
      invoice.xmr_subaddress = address;
    }

    let response;

    if (swapCoin === 'xmr') {
      response = {
        invoiceID: invoice.id,
        depositAddress: invoice.xmr_subaddress,
        depositAmount: invoice.xmr_amount,
        coin: swapCoin,
      };
    } else {
      requireProvider(!!trocadorApiKey, 'Crypto exchange');
      const reference = await swapProvider.paymentQuote(swapCoin, invoice.xmr_amount);
      await connection`UPDATE crypto_invoices SET provider_reference = ${reference}, provider_state = 'requested' WHERE id = ${invoice.id}`;

      const trade = await swapProvider.paymentTrade({
        tradeID: reference,
        coin: swapCoin,
        amount: invoice.xmr_amount,
        address: invoice.xmr_subaddress,
        refund: refundAddress || '',
      });
      response = {...trade, invoiceID: invoice.id, coin: swapCoin};
      await connection`UPDATE crypto_invoices SET provider_state = 'created', response = ${connection.json(response)} WHERE id = ${invoice.id}`;
    }

    await connection`UPDATE crypto_invoices SET response = ${connection.json(response)} WHERE id = ${invoice.id}`;

    return response;
  });
}
