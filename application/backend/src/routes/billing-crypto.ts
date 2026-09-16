import {allocateInvoiceAddress, quoteXmr} from '@core/wallet-service';
import {SOCKET_AUTH_INTERVAL, POLL_PRICES_INTERVAL} from '@core/constants';
import {cryptoPrices, invoiceConnections, watchWallet, billingReadiness} from '@core/states';
import {CRYPTO_DISCOUNT, PRICING_TIERS, PAYMENT_WINDOW_MIN} from '@core/constants';
import middlewareBase from '@middlewares/middleware-base';
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
  .post('/new-invoice', ({set, user, body}) => createInvoice(set, user?.email, body, false))
  .post('/renew', ({set, user, body}) => createInvoice(set, user?.email, body, true))
  .ws('/track-invoice/:id', {
    params: t.Object({id: t.String()}),
    async open(ws) {
      const invoiceID = ws.data.params.id;
      const authorize = ws.data.authorize;
      const user = ws.data.user;
      if (!user || !(await authorize())) return ws.close(1008, 'Session expired');

      const invoice = await sql`SELECT c.status, i.id AS identity_id FROM crypto_invoices c JOIN users u ON u.id = c.owner
        LEFT JOIN identities i ON i.crypto_invoice = c.id AND i.owner = c.owner
        WHERE c.id = ${invoiceID} AND u.email = ${user.email}`;

      if (!invoice.length) {
        ws.send(JSON.stringify({error: 'Invoice not found'}));

        return ws.close();
      }

      ws.send(JSON.stringify({status: invoice[0].status, identityID: invoice[0].identity_id}));
      const authTimer = setInterval(async () => {
        if (!(await authorize())) ws.close(1008, 'Session expired');
      }, SOCKET_AUTH_INTERVAL);
      invoiceConnections.set(ws.id, {websocket: ws, invoiceID, authorize, authTimer});
    },

    async close(ws) {
      clearInterval(invoiceConnections.get(ws.id)?.authTimer);
      invoiceConnections.delete(ws.id);
    },

    async message(ws, message) {
      if (!(await ws.data.authorize())) return ws.close(1008, 'Session expired');

      if (message === 'ping') ws.send('pong');
    },
  });

async function createInvoice(set: Record<string, any>, email: string | undefined, body: unknown, renewal: boolean) {
  if (!email) return error(set, 401, 'You are not logged in');
  const fields = ['plan', 'swapCoin', '?refundAddress', ...(renewal ? ['identityID'] : [])];
  const {err, plan, swapCoin, refundAddress, identityID} = await checkAPI(body, fields);
  if (err) return error(set, 400, err);

  const requestID = (body as {requestID?: string})?.requestID;
  if (!/^[a-f0-9-]{36}$/.test(requestID || '')) return error(set, 400, 'A payment request ID is required');
  if (!watchWallet || !cryptoPrices.xmr?.usdPrice || Date.now() - billingReadiness.priceSync > POLL_PRICES_INTERVAL * 3)
    return error(set, 503, 'Crypto billing is initializing');

  const users = await sql`SELECT id FROM users WHERE email = ${email}`;
  const owner = users[0].id;
  if (renewal) {
    const identities = await sql`SELECT id FROM identities WHERE id = ${identityID} AND owner = ${owner} AND plan = ${plan} AND status <> 'deleting'`;
    if (!identities.length) return error(set, 404, 'Identity not found or plan does not match');
  }

  const xmrAmount = quoteXmr(PRICING_TIERS[plan as keyof typeof PRICING_TIERS], CRYPTO_DISCOUNT, cryptoPrices.xmr.usdPrice);
  await sql`INSERT INTO crypto_invoices (owner, plan, xmr_amount, renewal_id, request_id, swap_coin, refund_address)
    VALUES (${owner}, ${plan}, ${xmrAmount}, ${renewal ? identityID : null}, ${requestID!}, ${swapCoin}, ${refundAddress || null})
    ON CONFLICT (owner, request_id) DO NOTHING`;

  const connection = await sql.reserve();
  let locked = false;

  try {
    const lock = await connection`SELECT pg_try_advisory_lock(hashtextextended(${`${owner}:${requestID}`}, 0)) AS acquired`;
    locked = lock[0].acquired;

    if (!locked) return error(set, 503, 'This operation is already running. Retry the same request shortly');
    const invoices = await connection`SELECT * FROM crypto_invoices WHERE owner = ${owner} AND request_id = ${requestID!}`;
    const invoice = invoices[0];

    if (
      invoice.plan !== plan ||
      invoice.swap_coin !== swapCoin ||
      (invoice.refund_address || '') !== (refundAddress || '') ||
      (invoice.renewal_id || null) !== (renewal ? identityID : null)
    ) {
      return error(set, 409, 'This payment request has different details. Start a new purchase');
    }

    if (Date.now() >= new Date(invoice.creation_date).getTime() + PAYMENT_WINDOW_MIN * 60_000) return error(set, 410, 'Quote expired. Start a new purchase');
    if (invoice.response) return invoice.response;
    if (invoice.provider_state === 'requested')
      return error(set, 503, 'Provider request needs reconciliation. Do not send payment or retry with a new purchase');

    if (!invoice.xmr_subaddress) {
      const address = await allocateInvoiceAddress(invoice.id, connection);
      await connection`UPDATE crypto_invoices SET xmr_subaddress = ${address} WHERE id = ${invoice.id}`;
      invoice.xmr_subaddress = address;
    }

    let response;
    if (swapCoin === 'xmr') response = {invoiceID: invoice.id, depositAddress: invoice.xmr_subaddress, depositAmount: invoice.xmr_amount, coin: swapCoin};
    else {
      await connection`UPDATE crypto_invoices SET provider_state = 'requested' WHERE id = ${invoice.id}`;
      const params = new URLSearchParams({
        ticker_from: swapCoin,
        ticker_to: 'xmr',
        network_from: net(swapCoin),
        network_to: 'Mainnet',
        amount_to: invoice.xmr_amount,
        address: invoice.xmr_subaddress,
        address_memo: '0',
        refund: refundAddress || '',
        refund_memo: '0',
      });
      const provider = await fetch(`https://api.trocador.app/new_trade?${params}`, {headers: {'API-Key': trocadorApiKey}, signal: AbortSignal.timeout(30_000)});
      const trade = await provider.json();
      if (!provider.ok || trade.error || !trade.trade_id || !trade.address_provider || !trade.amount_from)
        throw new Error('Provider request needs reconciliation');
      response = {
        invoiceID: invoice.id,
        depositAddress: trade.address_provider,
        depositAmount: trade.amount_from,
        depositMemo: trade.address_provider_memo,
        providerTradeID: trade.id_provider,
        externalLink: `https://trocador.app/en/checkout/${trade.trade_id}`,
        coin: swapCoin,
      };
      await connection`UPDATE crypto_invoices SET provider_reference = ${trade.trade_id}, provider_state = 'created' WHERE id = ${invoice.id}`;
    }
    await connection`UPDATE crypto_invoices SET response = ${connection.json(response)} WHERE id = ${invoice.id}`;

    return response;
  } finally {
    try {
      if (locked) await connection`SELECT pg_advisory_unlock(hashtextextended(${`${owner}:${requestID}`}, 0))`;
    } finally {
      connection.release();
    }
  }
}
