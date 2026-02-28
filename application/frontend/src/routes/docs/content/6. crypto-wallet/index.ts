import retrieveWallet from './retrieve-wallet';
import retrieveXmrNode from './retrieve-xmr-node';
import retrieveSwapRates from './retrieve-swap-rates';
import createSwapTrade from './create-swap-trade';
import broadcastTransaction from './broadcast-transaction';
import sweepInformation from './sweep-information';
import updateWalletBlob from './update-wallet-blob';
import type {Route} from '$type';

const routes: Route[] = [
  {
    title: 'retrieve wallet',
    description: retrieveWallet.description,
    url: '/crypto/:id',
    method: 'GET',
    code: retrieveWallet.code,
    response: retrieveWallet.response,
  },
  {
    title: 'retrieve xmr node',
    description: retrieveXmrNode.description,
    url: '/crypto/xmr-node/:id',
    method: 'GET',
    code: retrieveXmrNode.code,
    response: retrieveXmrNode.response,
  },
  {
    title: 'retrieve swap rates',
    description: retrieveSwapRates.description,
    url: '/crypto/swap-rates/:id',
    method: 'GET',
    code: retrieveSwapRates.code,
    response: retrieveSwapRates.response,
  },
  {
    title: 'create swap trade',
    description: createSwapTrade.description,
    url: '/crypto/swap-trades/:id',
    method: 'POST',
    code: createSwapTrade.code,
    response: createSwapTrade.response,
  },
  {
    title: 'broadcast transaction',
    description: broadcastTransaction.description,
    url: '/crypto/broadcast/:id',
    method: 'POST',
    code: broadcastTransaction.code,
    response: broadcastTransaction.response,
  },
  {
    title: 'sweep information',
    description: sweepInformation.description,
    url: '/crypto/sweep-info/:id',
    method: 'POST',
    code: sweepInformation.code,
    response: sweepInformation.response,
  },
  {
    title: 'update wallet blob',
    description: updateWalletBlob.description,
    url: '/crypto/update-blob/:id',
    method: 'PUT',
    code: updateWalletBlob.code,
    response: updateWalletBlob.response,
  },
];

export default routes;
