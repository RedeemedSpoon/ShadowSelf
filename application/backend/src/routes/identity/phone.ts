import {parseMessage, error} from '@utils/utils';
import {twilio} from '@utils/connection';
import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {Message} from '@types';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/phone'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const receivedMessages = await twilio.messages.list({to: identity!.phone});
    const sentMessages = await twilio.messages.list({from: identity!.phone});
    const allMessages = [...receivedMessages.reverse(), ...sentMessages.reverse()];

    const sortedMessages = allMessages.sort((a, b) => b.dateSent.getTime() - a.dateSent.getTime()).reverse();
    const conversations = new Map<string, Message>();

    sortedMessages.forEach((message) => {
      const contact = message.from === identity!.phone ? message.to : message.from;
      conversations.set(contact, parseMessage(message));
    });

    const messages = [...conversations.values()].reverse();
    return {messages};
  })
  .get('/fetch-conversation/:id', async ({set, identity, query}) => {
    const {err, addressee} = await checkAPI(query, ['addressee']);
    if (err) return error(set, 400, err);

    if (addressee === identity!.phone) return error(set, 400, 'You cannot fetch your own conversation');

    const sentMessages = await twilio.messages.list({to: addressee});
    const receivedMessages = await twilio.messages.list({from: addressee});

    let conversation = [...sentMessages, ...receivedMessages].map((msg) => parseMessage(msg));
    conversation = conversation.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {addressee, conversation};
  })
  .post('/send-message/:id', async ({set, identity, body}) => {
    const {err, addressee, body: messageBody} = await checkAPI(body, ['addressee', 'body']);
    if (err) return error(set, 400, err);

    if (addressee === identity!.phone) return error(set, 400, 'You cannot send a message to yourself');
    if (messageBody.length > 160) return error(set, 400, 'Message is too long (<160 characters)');

    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE;
    const params = {body: messageBody, messagingServiceSid, from: identity!.phone, to: addressee};

    try {
      const {sid} = await twilio.messages.create(params);

      await new Promise((resolve) => setTimeout(resolve, 500));
      const messageSent = parseMessage(await twilio.messages(sid).fetch());

      return {addressee, messageSent};
    } catch (e) {
      return error(set, 400, e instanceof Error ? e.message : (e as string));
    }
  })
  .delete('/delete-conversation/:id', async ({set, body}) => {
    const {err, addressee} = await checkAPI(body, ['addressee']);
    if (err) return error(set, 400, err);

    const receivedMessages = await twilio.messages.list({to: addressee});
    const sentMessages = await twilio.messages.list({from: addressee});

    for (const message of [...receivedMessages, ...sentMessages]) {
      await twilio.messages(message.sid).remove();
    }

    return {addressee};
  });
