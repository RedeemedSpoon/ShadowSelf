import {cryptoFees, cryptoPrices, throttle, useCache} from '@core/states';
import {ETH_API, BTC_API, LTC_API, USDT_CONTRACT} from '@core/constants';
import {getUtxoData, getEvmData, getXmrNode} from '@utils/crypto-nodes';
import middlewareApi from '@middlewares/middleware-api';
import type {CryptoWalletResponse} from '@type';
import {trocadorApiKey} from '@core/config';
import {error, net} from '@utils/utils';
import {checkAPI} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/crypto'})
  .use(middlewareApi)
  .get('/xmr-node/:id', async ({identity}) => ({
    startingDate: identity?.creation_date ?? new Date(),
    ...(await getXmrNode()),
  }))
  .get(
    '/:id',
    async ({identity}) => {
      const {btc, ltc, evm} = identity!.wallet_keys;
      const cryptoWallet = {} as CryptoWalletResponse;

      cryptoWallet.eth = await getEvmData('eth', evm);
      cryptoWallet.btc = await getUtxoData('btc', btc);

      await new Promise((resolve) => setTimeout(resolve, 500));
      cryptoWallet.ltc = await getUtxoData('ltc', ltc);
      cryptoWallet.usdt = await getEvmData('usdt', evm);

      const totalFunds = (['btc', 'ltc', 'eth', 'usdt'] as const).reduce((acc, coin) => {
        return acc + cryptoWallet[coin].balance * (cryptoPrices[coin]?.usdPrice ?? 0);
      }, 0);

      await sql`UPDATE identities SET wallet_funds = ${totalFunds} WHERE id = ${identity!.id}`;

      return {prices: cryptoPrices, fees: cryptoFees, wallet: cryptoWallet};
    },
    useCache('Wallet Overview', 60_000),
  )
  .get(
    '/swap-rates/:id',
    async ({query, set}) => {
      const {err, coinFrom, coinTo, amount} = await checkAPI(query, ['coinTo', 'coinFrom', 'amount']);
      if (err) return error(set, 400, err);

      const params = `?ticker_from=${coinFrom}&ticker_to=${coinTo}&network_from=${net(coinFrom)}&network_to=${net(coinTo)}&amount_from=${amount}`;
      const response = await fetch('https://api.trocador.app/new_rate' + params, {headers: {'API-Key': trocadorApiKey}});
      if (!response.ok) return error(set, 400, 'Something Went Wrong');

      const data = await response.json();
      const providers = data.quotes.quotes.map((val: any) => ({
        isFixed: val.fixed === 'True',
        costPercentage: parseFloat(val.USD_total_cost_percentage),
        returnUsd: val.amount_to_USD,
        returnCoin: val.amount_to,
        kycRating: val.kycrating,
        logPolicy: val.logpolicy,
        logo: val.provider_logo,
        name: val.provider,
        eta: val.eta,
      }));

      return {
        tradeID: data.trade_id,
        bestProvider: data.provider,
        providers,
        coinFrom,
        amount,
        coinTo,
      };
    },
    throttle('Swap Rates', 5_000),
  )
  .post(
    '/swap-trades/:id',
    async ({body, set}) => {
      const fields = ['tradeID', 'coinTo', 'coinFrom', 'amount', 'destinationAddress', 'refundAddress', 'provider', 'isFixed'];
      const {err, tradeID, coinTo, coinFrom, amount} = await checkAPI(body, fields);
      const {destinationAddress, refundAddress, provider, isFixed} = await checkAPI(body, fields);
      if (err) return error(set, 400, err);

      const params = new URLSearchParams({
        id: tradeID,
        ticker_from: coinFrom,
        ticker_to: coinTo,
        network_from: net(coinFrom),
        network_to: net(coinTo),
        amount_from: String(amount),
        address: destinationAddress,
        address_memo: '0',
        refund: refundAddress,
        refund_memo: '0',
        provider: provider,
        fixed: isFixed ? 'True' : 'False',
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
          status: data.status,
          depositAddress: data.address_provider,
          depositAmount: data.amount_from,
          depositMemo: data.address_provider_memo,
          providerTradeId: data.id_provider,
          externalLink: `https://trocador.app/en/checkout/${data.trade_id}`,
        };
      } catch (_) {
        return error(set, 502, 'Upstream Service Error');
      }
    },
    throttle('Swap Trade', 10_000),
  )
  .post(
    '/broadcast/:id',
    async ({body, set}) => {
      const {err, hex, coin} = await checkAPI(body, ['hex', 'coin']);
      if (err) return error(set, 400, err);

      const target = coin.toLowerCase();
      if (['btc', 'ltc'].includes(target)) {
        const url = target === 'btc' ? BTC_API : LTC_API;
        const response = await fetch(`${url}/tx`, {method: 'POST', body: hex});
        return {txid: await response.text()};
      }

      if (['eth', 'usdt'].includes(target)) {
        const response = await fetch(ETH_API + '/eth-rpc', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({id: 1, jsonrpc: '2.0', method: 'eth_sendRawTransaction', params: [hex]}),
        });

        return {txid: (await response.json()).result};
      }
    },
    throttle('Broadcast', 10_000),
  )
  .post(
    '/sweep-info/:id',
    async ({body, set}) => {
      const {err, coin, addresses} = await checkAPI(body, ['coin', 'addresses']);
      if (err) return error(set, 400, err);

      const target = coin.toLowerCase();
      if (['btc', 'ltc'].includes(target)) {
        const baseUrl = target === 'btc' ? BTC_API : LTC_API;

        const requests = addresses.map((addr) => fetch(`${baseUrl}/address/${addr}/utxo`));
        const responses = await Promise.all(requests);
        const jsonResults = await Promise.all(responses.map((r) => (r.ok ? r.json() : [])));

        const utxos = jsonResults.flatMap((list, i) =>
          Array.isArray(list)
            ? list.map((u: any) => ({
                txid: u.txid,
                vout: u.vout,
                value: u.value,
                address: addresses[i],
                path_index: 0,
              }))
            : [],
        );

        const balance = utxos.reduce((acc, u) => acc + u.value, 0);
        return {utxos, balance, nonce: 0};
      }

      if (['eth', 'usdt'].includes(target)) {
        const address = addresses[0];
        const nonceReq = fetch(`${ETH_API}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`);

        let balUrl = `${ETH_API}?module=account&address=${address}`;
        balUrl += target === 'usdt' ? `&action=tokenbalance&contractaddress=${USDT_CONTRACT}` : `&action=balance`;
        const balReq = fetch(balUrl);

        const [nonceRes, balRes] = await Promise.all([nonceReq, balReq]);
        const nonceData = await nonceRes.json();
        const balData = await balRes.json();

        return {utxos: [], balance: Number(balData.result), nonce: parseInt(nonceData.result, 16)};
      }
    },
    throttle('Sweep Info', 15_000),
  )
  .put('/update-encryption/:id', async ({identity, body, set}) => {
    const {blob, keys, err} = await checkAPI(body, ['blob', 'keys']);
    if (err) return error(set, 400, err);

    await sql`UPDATE identities SET wallet_blob = ${blob} WHERE id = ${identity!.id}`;
    await sql`UPDATE identities SET wallet_keys = jsonb_set(wallet_keys, '{xmr}', ${sql.json(keys)}::jsonb, true) WHERE id = ${identity!.id}`;

    return {blob, keys};
  });
