import {cryptoPrices, invoiceConnections, watchWallet} from '@core/states';
import {CRYPTO_DISCOUNT, PRICING_TIERS} from '@core/constants';
import middlewareBase from '@middlewares/middleware-base';
import type {QueryInvoice, QueryUser, User} from '@type';
import {trocadorApiKey} from '@core/config';
import {error, net} from '@utils/utils';
import {checkAPI} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia, t} from 'elysia';

type PayableRenewalInvoice = Pick<QueryInvoice, 'id' | 'status' | 'xmr_subaddress' | 'xmr_amount'>;

function xmrInvoiceResponse(invoice: PayableRenewalInvoice, identityID?: string) {
  return {
    invoiceID: invoice.id,
    ...(identityID ? {identityID} : {}),
    depositAddress: invoice.xmr_subaddress,
    depositAmount: Number(invoice.xmr_amount),
    coin: 'xmr',
    status: invoice.status,
  };
}

export default new Elysia({prefix: '/crypto', websocket: {idleTimeout: 300}})
  .use(middlewareBase)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(15);
    const mustLogIn = ['/new-invoice', '/renew'];

    if (mustLogIn.some((p) => relativePath === p || relativePath === p + '/') && !user) {
      return error(set, 401, 'You are not logged in');
    }
  })
  .post('/new-invoice', async ({set, user, body}) => {
    const {err, plan, swapCoin, refundAddress} = await checkAPI(body, ['plan', 'swapCoin', '?refundAddress']);
    if (err) return error(set, 400, err);

    const fiatPrice = PRICING_TIERS[plan as keyof typeof PRICING_TIERS] / 100;
    const discountedPrice = fiatPrice * (1 - CRYPTO_DISCOUNT / 100);
    const xmrPrice = cryptoPrices.xmr?.usdPrice;

    if (!xmrPrice) return error(set, 503, 'Crypto prices are currently unavailable');

    const xmrAmount = discountedPrice / xmrPrice;
    const subaddress = await watchWallet.createSubaddress(0, `Invoice for ${user!.email}`);
    const xmrSubaddress = subaddress.getAddress();

    const customer = (await sql`SELECT id FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const owner = customer[0].id;

    const invoiceResult = await sql`
      INSERT INTO crypto_invoices (owner, plan, xmr_subaddress, xmr_amount)
      VALUES (${owner}, ${plan}, ${xmrSubaddress}, ${xmrAmount})
      RETURNING id
    `;

    const invoiceID = invoiceResult[0].id;

    if (swapCoin === 'xmr') {
      return {
        invoiceID,
        depositAddress: xmrSubaddress,
        depositAmount: xmrAmount,
        coin: 'xmr',
      };
    }

    const params = new URLSearchParams({
      ticker_from: swapCoin,
      ticker_to: 'xmr',
      network_from: net(swapCoin),
      network_to: 'Mainnet',
      amount_to: String(xmrAmount),
      address: xmrSubaddress,
      address_memo: '0',
      refund: refundAddress,
      refund_memo: '0',
    });

    try {
      const response = await fetch(`https://api.trocador.app/new_trade?${params.toString()}`, {
        headers: {'API-Key': trocadorApiKey},
        method: 'GET',
      });

      const data = await response.json();
      if (!response.ok || (data as any).error) {
        return error(set, 400, (data as any).error || 'Failed to create trade at provider');
      }

      return {
        invoiceID,
        depositAddress: data.address_provider,
        depositAmount: data.amount_from,
        depositMemo: data.address_provider_memo,
        providerTradeID: data.id_provider,
        externalLink: `https://trocador.app/en/checkout/${data.trade_id}`,
        coin: swapCoin,
      };
    } catch (_) {
      return error(set, 502, 'Upstream Service Error');
    }
  })
  .post('/renew', async ({set, user, body}) => {
    const fields = ['plan', 'swapCoin', 'identityID', '?refundAddress'];
    const {err, plan, swapCoin, refundAddress, identityID} = await checkAPI(body, fields);
    if (err) return error(set, 400, err);

    const customer = (await sql`SELECT id FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const owner = customer[0].id;

    const identity = await sql`SELECT id, plan FROM identities WHERE id = ${identityID} AND owner = ${owner}`;
    if (!identity.length) return error(set, 404, 'Identity not found');
    if (identity[0].plan !== plan) return error(set, 404, 'Plan does not match');

    const fiatPrice = PRICING_TIERS[plan as keyof typeof PRICING_TIERS] / 100;
    const discountedPrice = fiatPrice * (1 - CRYPTO_DISCOUNT / 100);
    const xmrPrice = cryptoPrices.xmr?.usdPrice;

    if (!xmrPrice) return error(set, 503, 'Crypto prices are currently unavailable');

    const renewalInvoice = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(${owner}, hashtext(${`${plan}:${identityID}`}))`;

      const existingInvoices = (await tx`
        SELECT id, status, xmr_subaddress, xmr_amount
        FROM crypto_invoices
        WHERE owner = ${owner}
          AND plan = ${plan}
          AND renewal_id = ${identityID}
          AND status IN ('pending', 'confirming', 'underpaid')
        ORDER BY creation_date DESC
        LIMIT 1
      `) as PayableRenewalInvoice[];

      if (existingInvoices.length) return {invoice: existingInvoices[0], isNew: false};

      const xmrAmount = discountedPrice / xmrPrice;
      const subaddress = await watchWallet.createSubaddress(0, `Renewal for ${identityID}`);
      const xmrSubaddress = subaddress.getAddress();

      const invoiceResult = (await tx`
        INSERT INTO crypto_invoices (owner, plan, xmr_subaddress, xmr_amount, renewal_id)
        VALUES (${owner}, ${plan}, ${xmrSubaddress}, ${xmrAmount}, ${identityID})
        RETURNING id, status, xmr_subaddress, xmr_amount
      `) as PayableRenewalInvoice[];

      return {invoice: invoiceResult[0], isNew: true};
    });

    if (!renewalInvoice.isNew || swapCoin === 'xmr') return xmrInvoiceResponse(renewalInvoice.invoice, identityID);

    const params = new URLSearchParams({
      ticker_from: swapCoin,
      ticker_to: 'xmr',
      network_from: net(swapCoin),
      network_to: 'Mainnet',
      amount_to: String(renewalInvoice.invoice.xmr_amount),
      address: renewalInvoice.invoice.xmr_subaddress,
      address_memo: '0',
      refund: refundAddress,
      refund_memo: '0',
    });

    try {
      const response = await fetch(`https://api.trocador.app/new_trade?${params.toString()}`, {
        headers: {'API-Key': trocadorApiKey},
        method: 'GET',
      });

      const data = await response.json();
      if (!response.ok || (data as any).error) {
        return error(set, 400, (data as any).error || 'Failed to create trade at provider');
      }

      return {
        invoiceID: renewalInvoice.invoice.id,
        identityID,
        depositAddress: data.address_provider,
        depositAmount: data.amount_from,
        depositMemo: data.address_provider_memo,
        providerTradeID: data.id_provider,
        externalLink: `https://trocador.app/en/checkout/${data.trade_id}`,
        coin: swapCoin,
      };
    } catch (_) {
      return error(set, 502, 'Upstream Service Error');
    }
  })
  .ws('/track-invoice/:id', {
    params: t.Object({id: t.String()}),
    async open(ws) {
      const invoiceID = ws.data.params.id;
      const invoice = (await sql`SELECT status, owner FROM crypto_invoices WHERE id = ${invoiceID}`) as Pick<
        QueryInvoice,
        'status' | 'owner'
      >[];

      if (!invoice.length) {
        ws.send(JSON.stringify({error: 'Invoice not found'}));
        return ws.close();
      }

      const owner = await getInvoiceSocketOwner(ws);
      if (owner !== invoice[0].owner) {
        ws.send(JSON.stringify({error: 'You are not logged in'}));
        return ws.close(1014, 'You are not logged in');
      }

      ws.send(JSON.stringify({status: invoice[0].status}));
      invoiceConnections.set(ws.id, {websocket: ws, invoiceID});
    },

    async close(ws) {
      invoiceConnections.delete(ws.id);
    },

    async message(ws, message) {
      if (message === 'ping') ws.send('pong');
    },
  });

async function getInvoiceSocketOwner(ws: any) {
  const token = ws.data.cookie.token?.value;
  if (!token) return 0;

  const user = (await ws.data.jwt.verify(token)) as User;
  if (!user) return 0;

  const account = (await sql`SELECT id, sessions FROM users WHERE email = ${user.email}`) as QueryUser[];
  if (!account.length || !account[0].sessions.includes(user.id)) return 0;

  return account[0].id;
}
