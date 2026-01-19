// import {cryptoPrices, cryptoFees} from '@utils/polling';
import {attempt, error} from '@utils/utils';
import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {sql} from '@utils/connection';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/crypto'})
  .use(middleware)
  .get('/:id', async ({identity}) => {})
  .put('/update-blob/:id', async ({identity, body, set}) => {
    const {blob, err} = await checkAPI(body, ['blob']);
    if (err) return error(set, 400, err);

    await attempt(sql`UPDATE identities SET wallet_blob = ${blob} WHERE id = ${identity!.id}`);
    return {blob};
  });
