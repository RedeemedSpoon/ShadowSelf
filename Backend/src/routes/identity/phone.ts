import {parseMessage} from '@utils/utils';
import {twilio} from '@utils/connection';
import middleware from './middleware';
import {Elysia} from 'elysia';
import {Message} from '@types';

export default new Elysia({prefix: '/phone'}).use(middleware).get('/:id', async ({identity}) => {
  const receivedMessages = await twilio.messages.list({to: identity.phone});
  const sentMessages = await twilio.messages.list({from: identity.phone});
  const allMessages = [...receivedMessages.reverse(), ...sentMessages.reverse()];

  const sortedMessages = allMessages.sort((a, b) => b.dateSent.getTime() - a.dateSent.getTime()).reverse();
  const conversations = new Map<string, Message>();

  sortedMessages.forEach((message) => {
    const contact = message.from === identity.phone ? message.to : message.from;
    conversations.set(contact, parseMessage(message));
  });

  const messages = [...conversations.values()].reverse();
  return {messages};
});
