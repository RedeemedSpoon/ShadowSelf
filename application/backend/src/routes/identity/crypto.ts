import {cryptoPrices, cryptoFees, getUtxoData, getEvmData, getXmrNode} from '@utils/polling';
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
      if (!debounceCache[identity!.id]) return;
      debounceCache[identity!.id] = debounceCache[identity!.id].filter((item) => item.requestType !== REQUEST_TYPE);
      if (debounceCache[identity!.id].length === 0) delete debounceCache[identity!.id];
    }, DEBOUNCE_DURATION);

    return {prices: cryptoPrices, fees: cryptoFees, wallet: cryptoWallet};
  })
  .put('/update-blob/:id', async ({identity, body, set}) => {
    const {blob, err} = await checkAPI(body, ['blob']);
    if (err) return error(set, 400, err);

    await attempt(sql`UPDATE identities SET wallet_blob = ${blob} WHERE id = ${identity!.id}`);
    return {blob};
  });
