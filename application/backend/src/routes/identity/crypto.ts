import {cryptoPrices, cryptoFees, getUtxoData, getEvmData, getXmrNode, ETH_API, BTC_API, LTC_API, USDT_CONTRACT} from '@utils/polling';
import {sql, debounceCache} from '@utils/connection';
import {attempt, error} from '@utils/utils';
import {CryptoWalletResponse} from '@types';
import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/crypto'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const {btc, ltc, evm} = identity?.wallet_keys!;

    const REQUEST_TYPE = 'Wallet Overview';
    const DEBOUNCE_DURATION = 60_000;

    if (debounceCache[identity!.id]) {
      const cachedItem = debounceCache[identity!.id].find((item) => item.requestType === REQUEST_TYPE);
      if (cachedItem) return {prices: cryptoPrices, fees: cryptoFees, wallet: cachedItem.data};
    }

    const cryptoWallet = {} as CryptoWalletResponse;

    cryptoWallet.eth = await getEvmData('eth', evm);
    cryptoWallet.btc = await getUtxoData('btc', btc);

    await new Promise((resolve) => setTimeout(resolve, 500));
    cryptoWallet.ltc = await getUtxoData('ltc', ltc);
    cryptoWallet.usdt = await getEvmData('usdt', evm);

    cryptoWallet.xmr = {starting_date: identity?.creation_date!, ...(await getXmrNode())};

    if (!debounceCache[identity!.id]) debounceCache[identity!.id] = [];
    debounceCache[identity!.id].push({requestType: REQUEST_TYPE, data: cryptoWallet});

    setTimeout(() => {
      if (debounceCache[identity!.id])
        debounceCache[identity!.id] = debounceCache[identity!.id].filter((item) => item.requestType !== REQUEST_TYPE);
      if (debounceCache[identity!.id].length === 0) delete debounceCache[identity!.id];
    }, DEBOUNCE_DURATION);

    return {prices: cryptoPrices, fees: cryptoFees, wallet: cryptoWallet};
  })
  .post('/broadcast/:id', async ({identity, body, set}) => {
    const {hex, coin} = body as {hex: string; coin: string};
    const target = coin.toLowerCase();

    if (!['btc', 'ltc', 'eth', 'usdt'].includes(target)) return error(set, 400, 'Unsupported coin');

    const REQUEST_TYPE = 'Broadcast';
    const DEBOUNCE_DURATION = 5_000;

    if (debounceCache[identity!.id]?.find((i) => i.requestType === REQUEST_TYPE)) {
      return error(set, 429, 'Rate limit: Please wait 5s between broadcasts');
    }

    if (!debounceCache[identity!.id]) debounceCache[identity!.id] = [];
    debounceCache[identity!.id].push({requestType: REQUEST_TYPE, data: null});

    setTimeout(() => {
      if (debounceCache[identity!.id])
        debounceCache[identity!.id] = debounceCache[identity!.id].filter((i) => i.requestType !== REQUEST_TYPE);
    }, DEBOUNCE_DURATION);

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
  })
  .post('/sweep-info', async ({identity, body, set}) => {
    const {coin, addresses} = body as {coin: string; addresses: string[]};
    const target = coin.toLowerCase();

    if (!['btc', 'ltc', 'eth', 'usdt'].includes(target)) return error(set, 400, 'Unsupported coin');

    const REQUEST_TYPE = 'Sweep Scan';
    const DEBOUNCE_DURATION = 10_000;

    if (debounceCache[identity!.id]?.find((i) => i.requestType === REQUEST_TYPE)) {
      return error(set, 429, 'Rate limit: Please wait 10s between scans');
    }

    if (!debounceCache[identity!.id]) debounceCache[identity!.id] = [];
    debounceCache[identity!.id].push({requestType: REQUEST_TYPE, data: null});

    setTimeout(() => {
      if (debounceCache[identity!.id])
        debounceCache[identity!.id] = debounceCache[identity!.id].filter((i) => i.requestType !== REQUEST_TYPE);
    }, DEBOUNCE_DURATION);

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
  })
  .put('/update-blob/:id', async ({identity, body, set}) => {
    const {blob, err} = await checkAPI(body, ['blob']);
    if (err) return error(set, 400, err);

    await attempt(sql`UPDATE identities SET wallet_blob = ${blob} WHERE id = ${identity!.id}`);
    return {blob};
  });
