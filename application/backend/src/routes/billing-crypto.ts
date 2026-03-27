import {cryptoPrices, invoiceConnections, watchWallet} from '@core/states';
import {CRYPTO_DISCOUNT, PRICING_TIERS} from '@core/constants';
import middlewareBase from '@middlewares/middleware-base';
import type {QueryIdentity, QueryUser} from '@type';
import {trocadorApiKey} from '@core/config';
import {error, net} from '@utils/utils';
import {checkAPI} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia, t} from 'elysia';

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

    const xmrAmount = discountedPrice / xmrPrice;
    const subaddress = await watchWallet.createSubaddress(0, `Renewal for ${identityID}`);
    const xmrSubaddress = subaddress.getAddress();

    const invoiceResult = await sql`
      INSERT INTO crypto_invoices (owner, plan, xmr_subaddress, xmr_amount, renewal_id)
      VALUES (${owner}, ${plan}, ${xmrSubaddress}, ${xmrAmount}, ${identityID})
      RETURNING id
    `;

    const invoiceID = invoiceResult[0].id;

    if (swapCoin === 'xmr') {
      return {
        invoiceID,
        identityID: identityID,
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
        identityID: identityID,
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
      const invoice = await sql`SELECT status FROM crypto_invoices WHERE id = ${invoiceID}`;

      if (!invoice.length) {
        ws.send(JSON.stringify({error: 'Invoice not found'}));
        return ws.close();
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
