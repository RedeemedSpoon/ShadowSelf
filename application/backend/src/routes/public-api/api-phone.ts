import middlewareApi from '@middlewares/middleware-api';
import {phoneProvider} from '@core/phone-provider';
import {SMS_MAX_LENGTH} from '@core/constants';
import {checkAPI} from '@utils/checks';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/api/identities/:id/phone'})
  .use(middlewareApi)
  .get('/conversations', async ({identity, query}) => phoneProvider.conversations(identity!.phone, query.cursor))
  .get('/conversation', async ({set, identity, query}) => {
    const {err, addressee} = await checkAPI(query, ['addressee']);

    if (err) {
      return error(set, 400, err);
    }

    if (addressee === identity!.phone) {
      return error(set, 400, 'Choose another phone number');
    }

    return {addressee, ...(await phoneProvider.conversation(identity!.phone, addressee, query.cursor))};
  })
  .post('/messages', async ({set, identity, body}) => {
    const {err, addressee, body: text} = await checkAPI(body, ['addressee', 'body']);

    if (err) {
      return error(set, 400, err);
    }

    if (addressee === identity!.phone) {
      return error(set, 400, 'Choose another phone number');
    }

    if (text.length > SMS_MAX_LENGTH) {
      return error(set, 400, `Messages support up to ${SMS_MAX_LENGTH} characters`);
    }

    return {addressee, messageSent: await phoneProvider.send(identity!.phone, addressee, text)};
  })
  .delete('/conversations', async ({set, body, identity}) => {
    const {err, addressee} = await checkAPI(body, ['addressee']);

    if (err) {
      return error(set, 400, err);
    }

    const result = await phoneProvider.removeConversation(identity!.phone, addressee);

    return {addressee, ...result};
  });
