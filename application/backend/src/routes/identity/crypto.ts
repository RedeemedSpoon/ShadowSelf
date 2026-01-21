import {cryptoPrices, cryptoFees, getUtxoData, getEvmData, getXmrNode} from '@utils/polling';
import {xpubToAddress} from '@utils/cryptography';
import {attempt, error} from '@utils/utils';
import {CryptoWalletResponse} from '@types';
import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {sql} from '@utils/connection';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/crypto'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const {btc, ltc, evm} = identity?.wallet_keys!;

    // Debounce Here

    const cryptoWallet = {} as CryptoWalletResponse;

    const btcAddress = xpubToAddress('btc', btc);
    const ltcAddress = xpubToAddress('ltc', ltc);

    cryptoWallet.eth = await getEvmData('eth', evm);
    cryptoWallet.btc = await getUtxoData('btc', btcAddress);

    await new Promise((resolve) => setTimeout(resolve, 750));
    cryptoWallet.ltc = await getUtxoData('ltc', ltcAddress);
    cryptoWallet.usdt = await getEvmData('usdt', evm);

    cryptoWallet.xmr = {starting_date: identity?.creation_date!, ...(await getXmrNode())};
    return {prices: cryptoPrices, fees: cryptoFees, wallet: cryptoWallet};
  })
  .put('/update-blob/:id', async ({identity, body, set}) => {
    const {blob, err} = await checkAPI(body, ['blob']);
    if (err) return error(set, 400, err);

    await attempt(sql`UPDATE identities SET wallet_blob = ${blob} WHERE id = ${identity!.id}`);
    return {blob};
  });
